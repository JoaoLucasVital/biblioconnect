import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {logicalSnapshot} from './logical-snapshot.mjs';

// Run separately from application startup. No migration, reset or deletion.
const api=process.env.CATALOG_API_URL || 'http://127.0.0.1:3000';
const backend=path.resolve(process.env.BIBLIO_BACKEND_ROOT || fileURLToPath(new URL('../../../../',import.meta.url)));
const databaseUrl=process.env.CATALOG_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:55440/postgres?connection_limit=1';
const input=JSON.parse(await fs.readFile(new URL('./youth-books.json',import.meta.url),'utf8'));
const coverDirectory=path.resolve(process.env.CATALOG_COVER_DIR || '.local/youth-covers');
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const key=b=>`${normalize(b.titulo)}|${normalize(b.autor)}`;
const read=async()=>{const r=await fetch(`${api}/livros`);assert.equal(r.status,200);return r.json()};
{
  const before=await read();
  const login=await fetch(`${api}/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
    email:process.env.CATALOG_ADMIN_EMAIL || 'admin@biblioconnect.com',senha:process.env.CATALOG_ADMIN_PASSWORD || 'admin123'
  })});
  assert.equal(login.status,200,'Login administrativo');
  const {token}=await login.json();assert.ok(token);
  // Snapshot through the active PostgreSQL socket: never open/copy a live PGlite directory.
  const snapshot=await logicalSnapshot(databaseUrl);
  const stamp=new Date().toISOString().replaceAll(':','-');
  const backup=path.join(backend,'.local','backups',`before-youth-${stamp}`);
  await fs.mkdir(backup,{recursive:true});
  await fs.writeFile(path.join(backup,'logical-snapshot.json'),JSON.stringify(snapshot,null,2));
  await fs.writeFile(path.join(backup,'api-books.json'),JSON.stringify(before,null,2));
  const existing=new Set(before.map(key)),created=[],skipped=[];
  for(const [index,book] of input.entries()){
    if(existing.has(key(book))){skipped.push(book.titulo);continue}
    const data=new FormData();
    const fields=Object.fromEntries(['titulo','autor','isbn','ano','redator','categoria','sinopse'].map(name=>[name,book[name]]));
    Object.assign(fields,{precoCompra:[36,36,32,34,32,34,38,34,30,32][index],precoAluguel:[7,7,6,6,6,6,8,6,5,6][index],
      diasInclusos:7,precoDiaExtra:1,estoque:4+index%3,isDoado:false,destaque:true,disponivel:true});
    for(const [name,value] of Object.entries(fields))data.set(name,String(value));
    data.set('imagem',new Blob([await fs.readFile(path.join(coverDirectory,`${book.slug}.jpg`))],{type:'image/jpeg'}),`${book.slug}.jpg`);
    const r=await fetch(`${api}/livros`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:data});
    assert.equal(r.status,201,`Cadastro ${book.titulo}: ${await r.clone().text()}`);
    const saved=await r.json();created.push({id:saved.id,titulo:saved.titulo});existing.add(key(book));
  }
  const changed=[];
  for(const id of [34,35,36]){
    const row=before.find(b=>b.id===id);assert.ok(row,`Clássico autorizado ${id}`);
    if(!row.destaque)continue;
    const r=await fetch(`${api}/livros/${id}/destaque`,{method:'PATCH',headers:{'content-type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({destaque:false})});
    assert.equal(r.status,200);changed.push(id);
  }
  const after=await read();
  for(const row of before){
    const saved=after.find(b=>b.id===row.id);assert.ok(saved,`Registro preservado ${row.id}`);
    if(changed.includes(row.id)){
      const {updatedAt:oldDate,...oldFields}=row;const {updatedAt:newDate,...newFields}=saved;
      assert.deepEqual(newFields,{...oldFields,destaque:false},`Somente destaque alterado: ${row.id}`);
      assert.ok(newDate>=oldDate,'Timestamp automático do Prisma');
    }else assert.deepEqual(saved,row,`Registro integralmente preservado: ${row.id}`);
  }
  const snapshotAfter=await logicalSnapshot(databaseUrl);
  for(const [table,rows] of Object.entries(snapshot))if(table!=='Livro')assert.deepEqual(snapshotAfter[table],rows,`Tabela preservada: ${table}`);
  const books=[];
  for(const book of input){
    const matches=after.filter(b=>key(b)===key(book));assert.equal(matches.length,1,`Sem duplicação ${book.titulo}`);
    const saved=matches[0];assert.equal(saved.isbn,book.isbn);assert.equal(saved.destaque,true);
    const response=await fetch(new URL(saved.imagemUrl,api));assert.equal(response.status,200,book.slug);assert.match(response.headers.get('content-type'),/^image\//);
    books.push({id:saved.id,slug:book.slug,titulo:saved.titulo,autor:saved.autor,isbn:saved.isbn,categoria:saved.categoria,imagemUrl:saved.imagemUrl,
      ano:saved.ano,precoCompra:saved.precoCompra,precoAluguel:saved.precoAluguel,estoque:saved.estoque,destaque:saved.destaque,fonte:book.fonte,fonteImagem:book.fonteImagem});
  }
  assert.equal(after.length,before.length+created.length);
  const report={at:new Date().toISOString(),before:before.length,after:after.length,created,skipped,changedHighlights:changed,backup,
    verified:{originalBooksPreserved:true,otherTablesUnchanged:true,coversHttp200:books.length,uniqueBooks:books.length},books};
  const reportDir=new URL('../../docs/catalog/',import.meta.url);await fs.mkdir(reportDir,{recursive:true});
  const target=new URL(created.length?'youth-seed-result.json':'youth-seed-idempotency.json',reportDir);
  await fs.writeFile(target,JSON.stringify(report,null,2));
  console.log(JSON.stringify({before:report.before,after:report.after,created,skipped:skipped.length,changedHighlights:changed,backup,verified:report.verified}));
}
