// Intentionally uses an offline backup, never the running local database.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {parse} from 'dotenv';
import bcrypt from 'bcryptjs';
import {PrismaClient} from '@prisma/client';
import {PGlite} from '@electric-sql/pglite';
import {put,get,list} from '@vercel/blob';
import {businessTables,validateHostedTarget,readTable,copyBusinessData} from './lib/hosted-migration.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),execute=args.includes('--execute');
const argument=name=>{const index=args.indexOf(name);assert.ok(index>=0&&args[index+1],`Required: ${name}`);return path.resolve(args[index+1]);};
const env=parse(await fs.readFile(argument('--env-file')));
const destination=JSON.parse(await fs.readFile(argument('--destination'),'utf8'));
const snapshot=argument('--snapshot');
assert.ok(!snapshot.startsWith(path.join(root,'.git')));
validateHostedTarget(env.DATABASE_URL,destination);
assert.equal(destination.project,'biblioconnect');assert.equal(destination.projectId,'prj_rcrGQvHa9oIDy7ejLSFzZujrSf0W');
assert.equal(env.BLOB_PRIVATE_STORE_ID,destination.privateStoreId);
assert.ok(env.BLOB_READ_WRITE_TOKEN&&env.VERCEL_OIDC_TOKEN,'Managed storage credentials required');
const manifest=JSON.parse(await fs.readFile(path.join(snapshot,'hosted-snapshot.json'),'utf8'));assert.equal(manifest.version,1);
const checksum=bytes=>createHash('sha256').update(bytes).digest('hex');
async function verifiedFile(group,key){
  assert.ok(manifest.manifests[group]?.[key],'File absent from backup manifest');
  assert.ok(!key.includes('..')&&!path.isAbsolute(key));
  const bytes=await fs.readFile(path.join(snapshot,group,...key.split('/')));
  assert.equal(checksum(bytes),manifest.manifests[group][key],'Backup checksum mismatch');return bytes;
}
// Opening a disposable copy also leaves the original backup byte-for-byte intact.
const work=path.join(root,'.local/hosted',`source-${randomUUID()}`);await fs.mkdir(work,{recursive:true});
for(const key of Object.keys(manifest.manifests.database))await verifiedFile('database',key);
await fs.cp(path.join(snapshot,'database'),path.join(work,'database'),{recursive:true,errorOnExist:true,force:false});
const source=await PGlite.create(path.join(work,'database'));
const prisma=new PrismaClient({datasources:{db:{url:env.DATABASE_URL}}});
const adapter=client=>({query:async(sql,params=[])=>({rows:await client.$queryRawUnsafe(sql,...params)}),transaction:fn=>client.$transaction(tx=>fn(adapter(tx)),{timeout:120000,maxWait:10000})});
try{
  const tables={};for(const table of businessTables)tables[table]=await readTable(source,table);
  const users=tables.Usuario.map(row=>JSON.parse(row)),books=tables.Livro.map(row=>JSON.parse(row));
  let blockedDemo=0;
  for(const user of users){
    for(const field of ['tokenConfirmacaoEmail','tokenConfirmacaoHash','tokenConfirmacaoExpira','tokenResetSenha','tokenResetSenhaHash','tokenResetSenhaExpira'])user[field]=null;
    if(user.role==='ADMIN'&&user.senha&&await bcrypt.compare('admin123',user.senha)){user.bloqueado=true;user.senha=null;blockedDemo++;}
  }
  const covers=Object.keys(manifest.manifests.uploads).filter(key=>key.startsWith('livros/'));
  const avatars=users.filter(user=>user.avatarKey).map(user=>user.avatarKey);
  for(const key of covers)await verifiedFile('uploads',key);
  for(const key of avatars){assert.match(key,/^avatars\/[1-9]\d*\/[a-f0-9-]{36}\.webp$/);await verifiedFile('avatars',key);}
  for(const book of books)if(book.imagemUrl?.startsWith('/uploads/'))assert.ok(covers.includes(book.imagemUrl.slice('/uploads/'.length)),'Missing referenced cover');
  const existing=await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name<>'_prisma_migrations'");
  for(const {table_name:name} of existing){assert.ok(/^[A-Za-z][A-Za-z0-9_]*$/.test(name));assert.equal((await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM "${name}"`))[0].n,0,'Remote database is not empty');}
  const storageOptions={covers:{token:env.BLOB_READ_WRITE_TOKEN,access:'public'},avatars:{storeId:env.BLOB_PRIVATE_STORE_ID,oidcToken:env.VERCEL_OIDC_TOKEN,access:'private'}};
  for(const options of Object.values(storageOptions))assert.equal((await list({...options,limit:1})).blobs.length,0,'Target storage is not empty; inspect previous migration before retry');
  const summary={mode:execute?'execute':'dry-run',sourceCounts:Object.fromEntries(Object.entries(tables).map(([name,rows])=>[name,rows.length])),covers:covers.length,avatars:avatars.length,blockedDemo,ephemeralSessionsCopied:0};
  console.log(JSON.stringify(summary));
  if(!execute){await fs.writeFile(path.join(work,'dry-run.json'),JSON.stringify(summary,null,2));}
  else{
    assert.equal(existing.length,0,'Execute expects a completely new database; inspect partial setup before retry');
    const migration=spawnSync(process.execPath,[path.join(root,'node_modules/prisma/build/index.js'),'migrate','deploy'],{cwd:root,env:{...process.env,DATABASE_URL:env.DATABASE_URL},encoding:'utf8',windowsHide:true,timeout:120000});
    assert.equal(migration.status,0,'Schema deployment failed; inspect private diagnostics');
    const urls={};let mediaVerified=0;
    async function transfer(group,key,options){
      const bytes=await verifiedFile(group,key);
      const uploaded=await put(key,bytes,{...options,addRandomSuffix:false,allowOverwrite:false,contentType:key.endsWith('.webp')?'image/webp':key.endsWith('.png')?'image/png':'image/jpeg'});
      const result=await get(key,options);assert.equal(result?.statusCode,200);
      assert.equal(checksum(Buffer.from(await new Response(result.stream).arrayBuffer())),checksum(bytes),'Hosted media checksum mismatch');mediaVerified++;return uploaded.url;
    }
    for(const key of covers)urls[key]=await transfer('uploads',key,storageOptions.covers);
    for(const key of avatars)await transfer('avatars',key,storageOptions.avatars);
    for(const book of books)if(book.imagemUrl?.startsWith('/uploads/'))book.imagemUrl=urls[book.imagemUrl.slice('/uploads/'.length)];
    // PostgreSQL canonicalizes transformed records without parsing BigInt event IDs in JS.
    for(const [name,rows] of [['Usuario',users],['Livro',books]])tables[name]=rows.map(row=>JSON.stringify(row));
    const result=await copyBusinessData(adapter(prisma),tables);
    assert.deepEqual(result.counts,summary.sourceCounts);
    const report={...summary,targetCounts:result.counts,hashes:result.hashes,mediaVerified,completedAt:new Date().toISOString()};
    await fs.writeFile(path.join(work,'migration-result.json'),JSON.stringify(report,null,2));
    await fs.writeFile(path.join(root,'.superpowers/hosted-migration-result.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({migrated:true,counts:result.counts,mediaVerified,blockedDemo}));
  }
}finally{await source.close();await prisma.$disconnect();}
