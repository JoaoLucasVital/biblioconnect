import test from "node:test";
import assert from "node:assert/strict";
import {createTestDatabase} from "./helpers/database.js";
let service;try{service=await import("../src/services/accountTokenService.js");}catch(error){if(error.code!=="ERR_MODULE_NOT_FOUND")throw error;}
test("tokens têm hash, expiração estrita e consumo único concorrente; links antigos válidos continuam",async t=>{
  assert.equal(typeof service?.issueAccountToken,"function");const {prisma}=await createTestDatabase(t),now=new Date("2026-10-14T12:00:00Z");
  const user=await prisma.usuario.create({data:{nome:"Leitor",email:"token@example.test",senha:"hash"}});
  const issued=await service.issueAccountToken(prisma,{usuarioId:user.id,purpose:"confirmation",now});
  const stored=await prisma.usuario.findUnique({where:{id:user.id}});assert.notEqual(stored.tokenConfirmacaoHash,issued.token);assert.equal(stored.tokenConfirmacaoEmail,null);assert.equal(+issued.expiresAt-+now,86400000);
  const consumed=await Promise.all([1,2].map(()=>service.consumeAccountToken(prisma,{token:issued.token,purpose:"confirmation",now})));assert.equal(consumed.filter(Boolean).length,1);assert.equal((await prisma.usuario.findUnique({where:{id:user.id}})).emailConfirmado,true);
  const reset=await service.issueAccountToken(prisma,{usuarioId:user.id,purpose:"reset",now});assert.equal(+reset.expiresAt-+now,1800000);
  assert.equal(await service.consumeAccountToken(prisma,{token:reset.token,purpose:"reset",now:new Date(+now+1800000)}),null);
  await prisma.usuario.update({where:{id:user.id},data:{emailConfirmado:false,tokenConfirmacaoEmail:"a".repeat(64),tokenConfirmacaoExpira:new Date(+now+5000)}});
  assert.ok(await service.consumeAccountToken(prisma,{token:"a".repeat(64),purpose:"confirmation",now}));
  assert.equal(await service.consumeAccountToken(prisma,{token:"a".repeat(64),purpose:"confirmation",now}),null);
});
