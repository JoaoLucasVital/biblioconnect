import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const books=JSON.parse(await fs.readFile(new URL('./youth-books.json',import.meta.url),'utf8'));
const directory=path.resolve(process.env.CATALOG_COVER_DIR || '.local/youth-covers');
await fs.mkdir(directory,{recursive:true});
const report=[];
for(const book of books){
  const response=await fetch(book.fonteImagem,{signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200,book.slug);
  assert.match(response.headers.get('content-type') || '',/^image\//,book.slug);
  const bytes=Buffer.from(await response.arrayBuffer());
  assert.ok(bytes.length>2000,`Capa válida: ${book.slug}`);
  await fs.writeFile(path.join(directory,`${book.slug}.jpg`),bytes);
  report.push({slug:book.slug,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),source:book.fonteImagem});
}
await fs.writeFile(path.join(directory,'provenance.json'),JSON.stringify({at:new Date().toISOString(),covers:report},null,2));
console.log(JSON.stringify(report.map(({slug,bytes})=>({slug,bytes}))));
