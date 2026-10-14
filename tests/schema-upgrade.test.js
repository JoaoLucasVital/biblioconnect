import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const migrationName = "20261014000100_account_community_checkout";
const migrationRoot = new URL("../prisma/migrations/", import.meta.url);

test("migração de conta/comunidade preserva o acervo e aplica unicidade no banco", async t => {
  const migrationUrl = new URL(`${migrationName}/migration.sql`, migrationRoot);
  assert.ok(await fs.stat(migrationUrl).catch(() => null), "Migração aditiva de conta/comunidade precisa existir");
  const db = await PGlite.create();
  t.after(() => db.close());
  const names = (await fs.readdir(migrationRoot)).filter(name => /^\d/.test(name) && name < migrationName).sort();
  for (const name of names) await db.transaction(tx => fs.readFile(new URL(`${name}/migration.sql`, migrationRoot), "utf8").then(sql => tx.exec(sql)));
  await db.exec(`
    INSERT INTO "Usuario" (id,nome,email,senha,"emailConfirmado") VALUES (7,'Leitor preservado','preservado@example.test','hash-existente',true);
    INSERT INTO "Livro" (id,titulo,autor,redator,ano,categoria,sinopse,"precoCompra","precoAluguel","diasInclusos","precoDiaExtra",estoque,"updatedAt")
      VALUES (11,'Livro preservado','Autoria','Redação',2024,'Romance','Sinopse',50,10,7,2,3,NOW());
    INSERT INTO "Pedido" (id,tipo,status,"statusPagamento",valor,"retiradaLimite","usuarioId","livroId","updatedAt")
      VALUES (10,'compra','pendente','pendente',50,NOW()+INTERVAL '7 days',7,11,NOW());
    INSERT INTO "Pagamento" (id,valor,"pedidoId","updatedAt") VALUES (19,50,10,NOW());
  `);
  const snapshot = async () => Object.fromEntries(await Promise.all(["Usuario", "Livro", "Pedido", "Pagamento"].map(async table => [table,(await db.query(`SELECT * FROM "${table}" ORDER BY id`)).rows])));
  const before = await snapshot();
  await db.transaction(async tx => tx.exec(await fs.readFile(migrationUrl,"utf8")));
  const after = await snapshot();
  for (const table of ["Livro", "Pedido", "Pagamento"]) assert.deepEqual(after[table],before[table]);
  for (const [key,value] of Object.entries(before.Usuario[0])) assert.deepEqual(after.Usuario[0][key],value);
  assert.equal(after.Pagamento[0].gateway,"mercadopago");
  await db.query(`INSERT INTO "Usuario" (id,nome,email,senha) VALUES (8,'Social','social@example.test',NULL)`);
  await db.query(`INSERT INTO "Favorito" ("usuarioId","livroId") VALUES (7,11)`);
  await assert.rejects(db.query(`INSERT INTO "Favorito" ("usuarioId","livroId") VALUES (7,11)`), {code:"23505"});
  await db.query(`INSERT INTO "IdentidadeExterna" (id,provider,subject,"usuarioId") VALUES ('identity-one','google','subject-one',7)`);
  await assert.rejects(db.query(`INSERT INTO "IdentidadeExterna" (id,provider,subject,"usuarioId") VALUES ('identity-two','google','subject-one',8)`),{code:"23505"});
  await db.query(`INSERT INTO "EventoFavorito" ("livroId",total) VALUES (11,1)`);
  const events = (await db.query(`SELECT id,total FROM "EventoFavorito"`)).rows;
  assert.equal(events.length,1);
  assert.equal(events[0].total,1);
  await db.query(`INSERT INTO "EventoGateway" (id,gateway,"eventId",tipo) VALUES ('evt-local','stripe','evt_test','payment_intent.succeeded')`);
  await assert.rejects(db.query(`INSERT INTO "EventoGateway" (id,gateway,"eventId",tipo) VALUES ('evt-again','stripe','evt_test','payment_intent.succeeded')`),{code:"23505"});
  assert.equal((await db.query(`SELECT estoque FROM "Livro" WHERE id=11`)).rows[0].estoque,3);
});
