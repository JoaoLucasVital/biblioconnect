import test from 'node:test';
import assert from 'node:assert/strict';
import {createTestDatabase} from './helpers/database.js';
import {claimWelcome} from '../src/services/welcomeService.js';
import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs/promises';
test('migração não apresenta boas-vindas às contas antigas e preserva os dados',async t=>{
  const db=await PGlite.create();t.after(()=>db.close());
  await db.exec(`CREATE TABLE "Usuario" (id INT PRIMARY KEY,nome TEXT); INSERT INTO "Usuario" VALUES (7,'Leitor preservado');`);
  await db.exec(await fs.readFile(new URL('../prisma/migrations/20261015000100_welcome_once/migration.sql',import.meta.url),'utf8'));
  const old=(await db.query('SELECT * FROM "Usuario" WHERE id=7')).rows[0];assert.equal(old.nome,'Leitor preservado');assert.ok(old.welcomeSeenAt);
  await db.exec(`INSERT INTO "Usuario" (id,nome) VALUES (8,'Nova conta')`);
  assert.equal((await db.query('SELECT "welcomeSeenAt" FROM "Usuario" WHERE id=8')).rows[0].welcomeSeenAt,null);
});
test('apresentação de conta nova só pode ser reivindicada uma vez, mesmo em paralelo',async t=>{
  const {prisma}=await createTestDatabase(t);
  const user=await prisma.usuario.create({data:{nome:'Leitora nova',email:'welcome@example.test',emailConfirmado:true}});
  const claims=await Promise.all([claimWelcome(prisma,user.id),claimWelcome(prisma,user.id)]);
  assert.equal(claims.filter(x=>x.show).length,1);
  assert.equal((await claimWelcome(prisma,user.id)).show,false);
  assert.ok((await prisma.usuario.findUnique({where:{id:user.id}})).welcomeSeenAt);
  const another=await prisma.usuario.create({data:{nome:'Outra leitora',email:'other@example.test'}});
  assert.equal((await prisma.usuario.findUnique({where:{id:another.id}})).welcomeSeenAt,null);
});
