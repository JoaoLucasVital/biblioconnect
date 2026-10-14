// Explicit local maintenance: changes only Livro.imagemUrl. No schema/stock changes.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const report=JSON.parse(await fs.readFile(path.join(root,'docs/catalog/cover-optimization.json'),'utf8'));
const entries=report.covers.map(c=>({...c,stem:`cover-${c.id}-${c.sha256.slice(0,12)}`}));
const uploads=path.resolve(process.env.COVER_UPLOAD_DIR||path.join(root,'../../uploads/livros'));
const databaseUrl=process.env.COVER_DATABASE_URL||'postgresql://postgres:postgres@127.0.0.1:55440/postgres?connection_limit=1';
const parsed=new URL(databaseUrl);
assert.ok(['127.0.0.1','localhost'].includes(parsed.hostname)&&parsed.port==='55440','Only the explicitly named local persistent database is allowed.');
assert.equal(new Set(entries.map(c=>c.id)).size,entries.length,'Unique book IDs required');
for(const c of entries){assert.equal(path.basename(c.file),c.file);const file=await fs.readFile(path.join(root,'assets/book-covers',c.file));assert.equal(crypto.createHash('sha256').update(file).digest('hex'),c.sha256,'WebP checksum mismatch');}
if(!process.argv.includes('--apply')){
  console.log(JSON.stringify({mode:'dry-run',covers:entries.length,uploads,database:'127.0.0.1:55440',message:'Use --apply to copy verified WebP files and update only their image URLs.'}));
  process.exit(0);
}
// Use an independent driver with unnamed statements: the local PGlite adapter
// shares prepared-statement names, so a second Prisma engine would collide.
const {default:pg}=await import(pathToFileURL(path.join(root,'.local/media-tools/node_modules/pg/lib/index.js')).href);
const client=new pg.Client({connectionString:databaseUrl});
await client.connect();
try{
  const before=(await client.query('SELECT * FROM "Livro" ORDER BY id')).rows;
  for(const c of entries)assert.equal(before.find(b=>b.id===c.id)?.titulo,c.title,`Book identity changed: ${c.id}`);
  const backupDir=path.join(root,'.local/backups',`before-cover-upgrade-${new Date().toISOString().replaceAll(':','-')}`);
  await fs.mkdir(backupDir,{recursive:true});
  await fs.writeFile(path.join(backupDir,'books.json'),JSON.stringify(before,null,2),{flag:'wx'});
  await fs.mkdir(uploads,{recursive:true});
  for(const c of entries){
    const files=[{file:c.file,target:c.stem+'.webp'},...c.variants.map(v=>({file:v.file,target:`${c.stem}-${v.width}.webp`}))];
    for(const f of files){assert.equal(path.basename(f.file),f.file);const target=path.join(uploads,f.target);const bytes=await fs.readFile(path.join(root,'assets/book-covers',f.file));try{await fs.writeFile(target,bytes,{flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e;assert.deepEqual(await fs.readFile(target),bytes,'Existing image differs; refusing overwrite.');}}
  }
  const clean=b=>Object.fromEntries(Object.entries(b).filter(([key])=>!['imagemUrl','updatedAt'].includes(key)));
  let changed=0;
  await client.query('BEGIN');
  try{
    const start=(await client.query('SELECT * FROM "Livro" ORDER BY id')).rows;
    for(const c of entries){const current=start.find(b=>b.id===c.id);assert.equal(current?.titulo,c.title);const imagemUrl=`/uploads/livros/${c.stem}.webp`;if(current.imagemUrl===imagemUrl)continue;const result=await client.query('UPDATE "Livro" SET "imagemUrl"=$1 WHERE id=$2 AND "imagemUrl" IS NOT DISTINCT FROM $3',[imagemUrl,c.id,current.imagemUrl]);assert.equal(result.rowCount,1,'Image changed concurrently; rolling back.');changed++;}
    const after=(await client.query('SELECT * FROM "Livro" ORDER BY id')).rows;
    assert.deepEqual(after.map(clean),start.map(clean),'Non-image book fields changed; rolling back.');
    await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}
  for(const c of entries)for(const f of [{name:c.stem+'.webp',bytes:c.webpBytes},...c.variants.map(v=>({name:`${c.stem}-${v.width}.webp`,bytes:v.bytes}))]){
    const r=await fetch(`http://localhost:3000/uploads/livros/${f.name}`);
    assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image\/webp/);assert.equal((await r.arrayBuffer()).byteLength,f.bytes);
  }
  const application={at:new Date().toISOString(),covers:entries.length,changed,bookFieldsPreserved:true,originalFilesRetained:true,images:entries.map(c=>({id:c.id,title:c.title,imageUrl:`/uploads/livros/${c.stem}.webp`,width:c.pixels[0],height:c.pixels[1],variants:c.variants.map(v=>({imageUrl:`/uploads/livros/${c.stem}-${v.width}.webp`,width:v.width}))}))};
  await fs.writeFile(path.join(root,'docs/catalog/cover-application.json'),JSON.stringify(application,null,2)+'\n');
  console.log(JSON.stringify({covers:entries.length,changed,bookFieldsPreserved:true,allWebPResponsesVerified:true,backup:path.relative(root,backupDir)}));
}finally{await client.end();}
