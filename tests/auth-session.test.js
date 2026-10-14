import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createTestDatabase} from "./helpers/database.js";
let sessions,limits;
try{sessions=await import("../src/services/authSessionService.js");limits=await import("../src/services/rateLimitService.js");}catch(error){if(error.code!=="ERR_MODULE_NOT_FOUND")throw error;}
const day=86400000,now=new Date("2026-10-14T12:00:00Z");

test("sessões persistem só hashes, expiram nos limites exatos e são revogáveis",async t=>{
  assert.equal(typeof sessions?.createSession,"function","Serviço de sessões precisa existir");
  const {prisma}=await createTestDatabase(t);
  const user=await prisma.usuario.create({data:{nome:"Leitor",email:"session@example.test",senha:"hash",emailConfirmado:true}});
  const short=await sessions.createSession(prisma,{usuarioId:user.id,now});
  assert.equal(+short.absoluteExpiresAt-+now,12*3600000);
  const stored=await prisma.sessao.findUnique({where:{id:short.id}});
  assert.notEqual(stored.tokenHash,short.secret);
  assert.equal(stored.tokenHash,createHash("sha256").update(short.secret).digest("hex"));
  assert.ok(await sessions.resolveSession(prisma,{secret:short.secret,now:new Date(+now+12*3600000-1)}));
  assert.equal(await sessions.resolveSession(prisma,{secret:short.secret,now:new Date(+now+12*3600000)}),null);
  const long=await sessions.createSession(prisma,{usuarioId:user.id,lembrar:true,now});
  assert.equal(+long.idleExpiresAt-+now,90*day);
  assert.equal(+long.absoluteExpiresAt-+now,180*day);
  assert.equal(await sessions.resolveSession(prisma,{secret:long.secret,now:new Date(+now+90*day)}),null);
  const rolling=await sessions.createSession(prisma,{usuarioId:user.id,lembrar:true,now});
  const first=await sessions.resolveSession(prisma,{secret:rolling.secret,now:new Date(+now+89*day)});
  const second=await sessions.resolveSession(prisma,{secret:first.secret,now:new Date(+now+178*day)});
  assert.ok(second);
  assert.equal(+second.idleExpiresAt,+now+180*day);
  assert.equal(await sessions.resolveSession(prisma,{secret:second.secret,now:new Date(+now+180*day)}),null);
  const active=await sessions.createSession(prisma,{usuarioId:user.id,lembrar:true,now});
  await sessions.revokeSession(prisma,{secret:active.secret,now});
  assert.equal(await sessions.resolveSession(prisma,{secret:active.secret,now}),null);
  const blocked=await sessions.createSession(prisma,{usuarioId:user.id,lembrar:true,now});
  await prisma.usuario.update({where:{id:user.id},data:{bloqueado:true}});
  assert.equal(await sessions.resolveSession(prisma,{secret:blocked.secret,now}),null);
});

test("duas renovações preservam uma sessão e o segredo antigo tem janela limitada",async t=>{
  assert.equal(typeof sessions?.resolveSession,"function");
  const {prisma}=await createTestDatabase(t);
  const user=await prisma.usuario.create({data:{nome:"Leitor",email:"rotation@example.test",senha:"hash",emailConfirmado:true}});
  const initial=await sessions.createSession(prisma,{usuarioId:user.id,lembrar:true,now});
  const nextDay=new Date(+now+day+1);
  const resolved=await Promise.all([1,2].map(()=>sessions.resolveSession(prisma,{secret:initial.secret,now:nextDay})));
  assert.equal(resolved.filter(Boolean).length,2);
  assert.equal(await prisma.sessao.count(),1);
  const newSecrets=resolved.map(value=>value.secret).filter(Boolean);
  assert.equal(newSecrets.length,1);
  assert.ok(await sessions.resolveSession(prisma,{secret:initial.secret,now:new Date(+nextDay+29999)}));
  assert.equal(await sessions.resolveSession(prisma,{secret:initial.secret,now:new Date(+nextDay+30000)}),null);
  assert.ok(await sessions.resolveSession(prisma,{secret:newSecrets[0],now:new Date(+nextDay+30000)}));
  const latest=await prisma.sessao.findUnique({where:{id:initial.id}});
  assert.equal(+latest.idleExpiresAt,+nextDay+90*day);
});

test("rate limit concorrente usa contador atômico sem guardar identidade em claro",async t=>{
  assert.equal(typeof limits?.consumeRateLimit,"function");
  const {prisma}=await createTestDatabase(t),secret="local-test-secret-with-at-least-32-bytes";
  const requests=await Promise.all([1,2,3].map(()=>limits.consumeRateLimit(prisma,{scope:"test",key:"private@example.test",limit:2,windowMs:60000,now,secret})));
  assert.equal(requests.filter(value=>value.allowed).length,2);
  assert.ok(requests.find(value=>!value.allowed).retryAfterSeconds>0);
  const stored=await prisma.limiteOperacao.findFirst();
  assert.ok(!JSON.stringify(stored).includes("private@example.test"));
  assert.equal((await limits.consumeRateLimit(prisma,{scope:"test",key:"private@example.test",limit:2,windowMs:60000,now:new Date(+now+60000),secret})).allowed,true);
});
