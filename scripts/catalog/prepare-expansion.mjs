import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

// Resumable preparation only; no database writes.
const root=path.resolve('.local/catalog-expansion');await fs.mkdir(root,{recursive:true});
const headers={'User-Agent':'BiblioConnect-Catalog/1.0'};
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const existing=await(await fetch('http://127.0.0.1:3000/livros')).json();
const keys=new Set(existing.map(book=>normalize(book.titulo))),isbns=new Set(existing.map(book=>book.isbn).filter(Boolean));
// Avoid alternate regional titles of existing works and malformed catalog titles.
for(const title of ['A Criada','Los Pilares da Terra'])keys.add(normalize(title));
const books=[],seenWorks=new Set(),failures=[];
const groups=[['fantasy','Fantasia'],['romance','Romance'],['thriller','Suspense'],['young adult fiction','Juvenil'],['science fiction','Ficção científica'],['mystery','Mistério']];
const fields='key,title,author_name,editions,editions.key,editions.title,editions.language,editions.cover_i,editions.isbn,editions.publisher,editions.publish_date';
for(const [subject,categoria]of groups){
  if(books.length>=110)break;
  const maximum=subject==='fantasy'||subject==='romance'?30:25;let inGroup=0;
  const cache=path.join(root,`search-${normalize(subject)}.json`);let data;
  try{data=JSON.parse(await fs.readFile(cache,'utf8'));}
  catch(error){if(error.code!=='ENOENT')throw error;const url=new URL('https://openlibrary.org/search.json');url.search=new URLSearchParams({q:`language:por subject:"${subject}"`,lang:'pt',limit:'100',fields});const response=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,`Search ${subject}`);data=await response.json();await fs.writeFile(cache,JSON.stringify(data));}
  for(const work of data.docs||[]){
    if(books.length>=110||inGroup>=maximum)break;
    const edition=work.editions?.docs?.[0];
    if(!edition?.language?.includes('por')||!edition.cover_i||!work.author_name?.length||!edition.publisher?.length||seenWorks.has(work.key))continue;
    const titulo=edition.title.trim(),titleKey=normalize(titulo),isbn=edition.isbn?.find(value=>/^97[89]\d{10}$/.test(value))||null;
    const year=String(edition.publish_date?.[0]||'').match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
    if(keys.has(titleKey)||isbn&&isbns.has(isbn)||!year||titulo.length>150)continue;
    const filename=`ol-${edition.cover_i}.webp`,file=path.join(root,filename),coverSource=`https://covers.openlibrary.org/b/id/${edition.cover_i}-L.jpg?default=false`;
    let downloaded=false;
    try{
      let bytes;try{bytes=await fs.readFile(file);}catch(error){if(error.code!=='ENOENT')throw error;downloaded=true;const response=await fetch(coverSource,{headers,signal:AbortSignal.timeout(20000)});assert.equal(response.status,200);const raw=Buffer.from(await response.arrayBuffer()),meta=await sharp(raw).metadata();assert.ok(meta.width>=180&&meta.height>=250);bytes=await sharp(raw).rotate().resize({width:900,height:1350,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer();await fs.writeFile(file,bytes);}
      const meta=await sharp(bytes).metadata();assert.equal(meta.format,'webp');
      books.push({titulo,autor:work.author_name.join(', '),isbn,ano:Number(year[0]),redator:edition.publisher.join(', '),categoria,sinopse:`${titulo}, de ${work.author_name.join(', ')}. Edição em português publicada por ${edition.publisher.join(', ')} em ${year[0]}.`,precoCompra:39.9,precoAluguel:7.9,diasInclusos:7,precoDiaExtra:1.5,estoque:5,isDoado:false,destaque:false,disponivel:true,coverFile:filename,source:`https://openlibrary.org${edition.key}`,work:work.key,coverSource,coverSha256:createHash('sha256').update(bytes).digest('hex'),coverWidth:meta.width,coverHeight:meta.height});
      keys.add(titleKey);if(isbn)isbns.add(isbn);seenWorks.add(work.key);inGroup++;
      if(books.length%10===0)console.log(JSON.stringify({prepared:books.length,category:categoria}));
    }catch(error){failures.push({title:titulo,message:error.message});}
    if(downloaded)await new Promise(resolve=>setTimeout(resolve,1100));
  }
}
await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({preparedAt:new Date().toISOString(),books,failures},null,2));
assert.equal(books.length,110,`Only ${books.length} complete records; inspect cached searches before importing`);
console.log(JSON.stringify({prepared:books.length,failures:failures.length,categories:Object.fromEntries(groups.map(([,category])=>[category,books.filter(book=>book.categoria===category).length]))}));
