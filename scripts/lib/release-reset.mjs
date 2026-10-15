import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

export const usageTables=['EventoGateway','Pagamento','Pedido','MensagemChat','Conversa','Avaliacao','Favorito','EventoFavorito','OperacaoIdempotente','Sessao','DesafioGoogle','LimiteOperacao'];

// Administrative maintenance only. Never imported by the public application.
// Callers must back up and verify the target before invoking this transaction.
export async function resetForOwner(connection,{user,identity}){
  assert.ok(user.emailConfirmado&&identity?.provider==='google'&&identity.subject&&identity.usuarioId===user.id,'Verified Google owner required');
  return connection.transaction(async tx=>{
    const before=(await tx.query('SELECT count(*)::int AS n FROM "Livro"')).rows[0].n;
    let owner=(await tx.query('SELECT id FROM "Usuario" WHERE email=$1',[user.email])).rows[0];
    if(!owner)owner=(await tx.query('INSERT INTO "Usuario"(nome,email,role,"emailConfirmado") VALUES($1,$2,\'ADMIN\',true) RETURNING id',[user.nome,user.email])).rows[0];
    for(const table of usageTables)await tx.query(`DELETE FROM "${table}"`);
    await tx.query('DELETE FROM "IdentidadeExterna" WHERE NOT (provider=\'google\' AND subject=$1)',[identity.subject]);
    await tx.query('INSERT INTO "IdentidadeExterna"(id,provider,subject,"usuarioId") VALUES($1,\'google\',$2,$3) ON CONFLICT(provider,subject) DO UPDATE SET "usuarioId"=EXCLUDED."usuarioId"',[randomUUID(),identity.subject,owner.id]);
    await tx.query('DELETE FROM "Usuario" WHERE id<>$1',[owner.id]);
    await tx.query('UPDATE "Usuario" SET role=\'ADMIN\',senha=NULL,bloqueado=false,"emailConfirmado"=true,"welcomeSeenAt"=COALESCE("welcomeSeenAt",now()),"stripeCustomerId"=NULL,"tokenConfirmacaoEmail"=NULL,"tokenConfirmacaoHash"=NULL,"tokenConfirmacaoExpira"=NULL,"tokenResetSenha"=NULL,"tokenResetSenhaHash"=NULL,"tokenResetSenhaExpira"=NULL WHERE id=$1',[owner.id]);
    assert.equal((await tx.query('SELECT count(*)::int AS n FROM "Usuario"')).rows[0].n,1);
    assert.equal((await tx.query('SELECT count(*)::int AS n FROM "Livro"')).rows[0].n,before);
    return {ownerId:owner.id,users:1,booksPreserved:before};
  });
}
