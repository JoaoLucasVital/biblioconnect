import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const businessTables=['Usuario','Livro','Pedido','Pagamento','IdentidadeExterna','Favorito','EventoFavorito','EventoGateway','Avaliacao','Conversa','MensagemChat'];
const identifier=value=>{assert.match(value,/^[A-Za-z][A-Za-z0-9_]*$/);return `"${value}"`;};
export function validateHostedTarget(value,expected){
  const url=new URL(value);
  assert.ok(['postgres:','postgresql:'].includes(url.protocol));
  assert.match(expected.hostname,/^[a-z0-9.-]+\.neon\.tech$/);
  assert.equal(url.hostname,expected.hostname,'Unexpected target host');
  assert.equal(decodeURIComponent(url.pathname.slice(1)),expected.database,'Unexpected target database');
  assert.equal(url.searchParams.get('sslmode'),'require','Hosted connection must require TLS');
  return url;
}
export async function readTable(connection,table){
  return (await connection.query(`SELECT to_jsonb(t)::text AS row FROM ${identifier(table)} t ORDER BY id`)).rows.map(item=>item.row);
}
export function digest(rows){return createHash('sha256').update([...rows].sort().join('\n')).digest('hex');}
export async function tableDigest(connection,table){return digest(await readTable(connection,table));}
export async function copyBusinessData(connection,tables){
  const names=Object.keys(tables);
  assert.ok(names.length>0);assert.ok(names.every(name=>businessTables.includes(name)),'Unexpected business table');
  // Check again inside the transaction, under locks, before any write.
  return connection.transaction(async tx=>{
    await tx.query(`LOCK TABLE ${names.map(identifier).join(',')} IN EXCLUSIVE MODE`);
    for(const name of names){
      const {rows}=await tx.query(`SELECT count(*)::int AS count FROM ${identifier(name)}`);
      assert.equal(rows[0].count,0,`${name}: target must be empty`);
    }
    const counts={},hashes={};
    for(const name of businessTables.filter(name=>names.includes(name))){
      const canonical=[];
      for(const row of tables[name])canonical.push((await tx.query('SELECT $1::jsonb::text AS row',[row])).rows[0].row);
      for(const row of tables[name])await tx.query(`INSERT INTO ${identifier(name)} SELECT * FROM jsonb_populate_record(NULL::${identifier(name)},$1::jsonb)`,[row]);
      const actual=await readTable(tx,name);counts[name]=actual.length;hashes[name]=digest(actual);
      assert.equal(actual.length,tables[name].length,`${name}: count mismatch`);
      assert.equal(hashes[name],digest(canonical),`${name}: checksum mismatch`);
      const {rows}=await tx.query('SELECT pg_get_serial_sequence($1,\'id\') AS sequence',[identifier(name)]);
      if(rows[0].sequence)await tx.query(`SELECT setval($1::regclass,COALESCE((SELECT max(id) FROM ${identifier(name)}),1),(SELECT count(*)>0 FROM ${identifier(name)}))`,[rows[0].sequence]);
    }
    return {counts,hashes};
  });
}
