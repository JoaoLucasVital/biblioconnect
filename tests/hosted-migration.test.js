import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {validateHostedTarget, copyBusinessData, tableDigest} from '../scripts/lib/hosted-migration.mjs';

test('migration rejects other hosts, databases, local URLs and nonempty targets',async t=>{
  const expected={hostname:'ep-example-pooler.sa-east-1.aws.neon.tech',database:'neondb'};
  assert.throws(()=>validateHostedTarget('postgresql://x:y@localhost/neondb',expected));
  assert.throws(()=>validateHostedTarget('postgresql://x:y@other.neon.tech/neondb',expected));
  assert.throws(()=>validateHostedTarget(`postgresql://x:y@${expected.hostname}/other`,expected));
  validateHostedTarget(`postgresql://x:y@${expected.hostname}/neondb?sslmode=require`,expected);
  const db=await PGlite.create();t.after(()=>db.close());
  await db.exec('CREATE TABLE "Livro"(id serial PRIMARY KEY, titulo text); INSERT INTO "Livro"(titulo) VALUES (\'existing\')');
  await assert.rejects(copyBusinessData(db,{Livro:['{"id":9,"titulo":"incoming"}']}),/empty/i);
  assert.equal((await db.query('SELECT titulo FROM "Livro"')).rows[0].titulo,'existing');
});

test('copy preserves relations and hashes and advances sequences; errors roll back',async t=>{
  const db=await PGlite.create();t.after(()=>db.close());
  await db.exec('CREATE TABLE "Usuario"(id serial PRIMARY KEY, nome text); CREATE TABLE "Livro"(id serial PRIMARY KEY, titulo text); CREATE TABLE "Pedido"(id serial PRIMARY KEY, "usuarioId" int REFERENCES "Usuario", "livroId" int REFERENCES "Livro")');
  const source={Usuario:['{"id":5,"nome":"Leitora"}'],Livro:['{"id":22,"titulo":"Livro"}'],Pedido:['{"id":8,"usuarioId":5,"livroId":22}']};
  const result=await copyBusinessData(db,source);
  assert.deepEqual(result.counts,{Usuario:1,Livro:1,Pedido:1});
  assert.equal(await tableDigest(db,'Pedido'),result.hashes.Pedido);
  assert.equal((await db.query('INSERT INTO "Livro"(titulo) VALUES (\'Next\') RETURNING id')).rows[0].id,23);
  await db.exec('TRUNCATE "Pedido", "Usuario", "Livro" RESTART IDENTITY');
  await assert.rejects(copyBusinessData(db,{...source,Pedido:['{"id":8,"usuarioId":999,"livroId":22}']}));
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "Usuario"')).rows[0].n,0);
});
