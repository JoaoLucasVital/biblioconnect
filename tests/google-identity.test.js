import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {createTestDatabase} from "./helpers/database.js";
let google,routes;
try{google=await import("../src/services/googleIdentityService.js");routes=await import("../src/routes/googleAuthRoutes.js");}catch(error){if(error.code!=="ERR_MODULE_NOT_FOUND")throw error;}
const claims={sub:"google-subject",email:"new@gmail.com",email_verified:true,name:"Leitor Google",iss:"https://accounts.google.com",aud:"client-id",nonce:"challenge",exp:Math.floor(Date.now()/1000)+300};
test("verificação oficial rejeita assinatura, issuer, audience, expiração e nonce inválidos",async()=>{
  assert.equal(typeof google?.verifyGoogleCredential,"function");
  const options={clientId:"client-id",nonce:"challenge",client:{verifyIdToken:async()=>({getPayload:()=>claims})}};
  assert.equal((await google.verifyGoogleCredential("signed",options)).sub,claims.sub);
  for(const invalid of [{iss:"evil"},{aud:"other"},{nonce:"other"},{exp:0},{email_verified:false}]){
    await assert.rejects(google.verifyGoogleCredential("signed",{...options,client:{verifyIdToken:async()=>({getPayload:()=>({...claims,...invalid})})}}),/inválid/i);
  }
  await assert.rejects(google.verifyGoogleCredential("bad",{...options,client:{verifyIdToken:async()=>{throw new Error("invalid signature");}}}),/inválid/i);
});
test("Google cria CLIENTE, preserva nome editado, não vincula por email e respeita confirmação e bloqueio",async t=>{
  assert.equal(typeof google?.resolveGoogleIdentity,"function");const {prisma}=await createTestDatabase(t);
  const created=await google.resolveGoogleIdentity(prisma,{claims:{...claims,role:"ADMIN"}});
  assert.equal(created.usuario.role,"CLIENTE");assert.equal(created.usuario.senha,undefined);assert.equal(created.usuario.emailConfirmado,true);
  await prisma.usuario.update({where:{id:created.usuario.id},data:{nome:"Meu nome editado"}});
  assert.equal((await google.resolveGoogleIdentity(prisma,{claims})).usuario.nome,"Meu nome editado");
  const before=await prisma.identidadeExterna.findMany();
  const collision=await google.resolveGoogleIdentity(prisma,{claims:{...claims,sub:"another-sub"}});
  assert.equal(collision.needsAccountLink,true);assert.deepEqual(await prisma.identidadeExterna.findMany(),before);
  const linked=await google.resolveGoogleIdentity(prisma,{claims:{...claims,sub:"another-sub"},authenticatedUserId:created.usuario.id});assert.equal(linked.usuario.id,created.usuario.id);
  const third=await google.resolveGoogleIdentity(prisma,{claims:{...claims,sub:"third-party",email:"reader@example.test"}});assert.equal(third.needsEmailConfirmation,true);assert.equal(third.usuario.emailConfirmado,false);
  const workspace=await google.resolveGoogleIdentity(prisma,{claims:{...claims,sub:"workspace",email:"reader@campus.test",hd:"campus.test"}});assert.equal(workspace.needsEmailConfirmation,false);
  await prisma.usuario.update({where:{id:created.usuario.id},data:{bloqueado:true}});await assert.rejects(google.resolveGoogleIdentity(prisma,{claims}),/indisponível/i);
});
test("desafio Google exige cookie, expira e só pode ser consumido uma vez",async t=>{
  assert.equal(typeof routes?.createGoogleAuthRoutes,"function");const {prisma}=await createTestDatabase(t);
  const auth={requireOrigin:(req,res,next)=>next(),authenticate:(req,res,next)=>next(),rateLimit:()=>((req,res,next)=>next()),signIn:(res,{usuarioId})=>res.json({usuarioId})};
  const app=express();app.use(express.json());app.use(routes.createGoogleAuthRoutes({prisma,auth,clientId:"client-id",enabled:true,verify:async(_credential,{nonce})=>({...claims,nonce})}));
  const server=app.listen(0,"127.0.0.1");await new Promise(resolve=>server.once("listening",resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const url=`http://127.0.0.1:${server.address().port}`;
  const challenge=await fetch(url+"/auth/google/challenge",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
  const data=await challenge.json(),cookie=challenge.headers.get("set-cookie").split(";")[0];
  const send=(headers={Cookie:cookie})=>fetch(url+"/auth/google",{method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify({credential:"signed",challengeId:data.challengeId,nonce:data.nonce})});
  assert.equal((await send({})).status,401);assert.equal((await send()).status,200);assert.equal((await send()).status,401);
  const stored=await prisma.desafioGoogle.findUnique({where:{id:data.challengeId}});assert.notEqual(stored.nonceHash,data.nonce);assert.ok(stored.consumedAt);
  const expired=await fetch(url+"/auth/google/challenge",{method:"POST"}),expiredData=await expired.json();
  await prisma.desafioGoogle.update({where:{id:expiredData.challengeId},data:{expiresAt:new Date(0)}});
  const expiredLogin=await fetch(url+"/auth/google",{method:"POST",headers:{"Content-Type":"application/json",Cookie:expired.headers.get("set-cookie").split(";")[0]},body:JSON.stringify({credential:"signed",...expiredData})});
  assert.equal(expiredLogin.status,401);
});
