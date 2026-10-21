import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import * as isbnModule from '../src/services/isbnService.js';
const isbn='9788532530783';
const image=await sharp({create:{width:120,height:180,channels:3,background:'#345678'}}).jpeg().toBuffer();
const book={title:'Harry Potter e a Pedra Filosofal',authors:[{name:'J. K. Rowling'}],publishers:[{name:'Rocco'}],publish_date:'Mar 14, 2017',number_of_pages:208,subjects:[{name:'Fantasy fiction'},{name:'Juvenile fiction'}],cover:{large:'https://covers.openlibrary.org/b/id/8436965-L.jpg'}};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
function service({googleStatus=429,openBook=book,googleItems=[],edition={works:[{key:'/works/OL82563W'}],languages:[{key:'/languages/por'}]},work={description:{value:'Uma aventura em uma escola de magia.'}},coverFetch,clock,offline=()=>false}={}){
  assert.equal(typeof isbnModule.createIsbnService,'function');const calls=[];
  const fetchImpl=async(address,options)=>{const url=new URL(address);calls.push({url:url.href,options});
    if(offline())throw Error('Fonte indisponível');
    if(url.hostname==='www.googleapis.com')return json({items:googleItems},googleStatus);
    if(url.hostname==='openlibrary.org'&&url.pathname==='/api/books')return json(openBook?{['ISBN:'+isbn]:openBook}:{});
    if(url.hostname==='openlibrary.org'&&url.pathname==='/isbn/'+isbn+'.json')return json(edition);
    if(url.hostname==='openlibrary.org'&&url.pathname==='/works/OL82563W.json')return json(work);
    if(['covers.openlibrary.org','books.google.com','archive.org'].includes(url.hostname)||/^ia\d+\.us\.archive\.org$/.test(url.hostname))return coverFetch?coverFetch(url,options):new Response(image,{headers:{'content-type':'image/jpeg'}});
    throw Error('Destino inesperado '+url.href);
  };
  return {instance:isbnModule.createIsbnService({fetchImpl,now:clock||Date.now}),calls};
}
test('consulta continua preenchendo dados e capa quando Google responde quota excedida',async()=>{
  const {instance,calls}=service();const data=await instance.lookup('978-85-325-3078-3');
  assert.equal(data.isbn,isbn);assert.equal(data.titulo,book.title);assert.equal(data.autor,'J. K. Rowling');assert.equal(data.redator,'Rocco');assert.equal(data.ano,2017);assert.equal(data.categoria,'Fantasia');assert.equal(data.sinopse,'Uma aventura em uma escola de magia.');assert.ok(data.imagemUrl);assert.deepEqual(data.camposAusentes,[]);
  const cover=await instance.cover(isbn);assert.equal((await sharp(cover).metadata()).format,'webp');
  await instance.lookup(isbn);assert.equal(calls.filter(c=>c.url.includes('/api/books?')).length,1,'Cache evita repetir consulta');
});
test('valida checksum antes da rede e converte ISBN-10 equivalente',async()=>{
  const {instance,calls}=service();await assert.rejects(instance.lookup('9788532530784'),/ISBN/);assert.equal(calls.length,0);
  const data=await instance.lookup('8532530788');assert.equal(data.isbn,isbn);
});
test('não aceita volume Google de outra edição e distingue vazio de indisponibilidade',async()=>{
  const {instance}=service({openBook:null,googleStatus:200,googleItems:[{volumeInfo:{title:'Livro errado',industryIdentifiers:[{identifier:'9780140449136'}]}}]});
  assert.equal(await instance.lookup(isbn),null);
  const unavailable=isbnModule.createIsbnService({fetchImpl:async()=>{throw Error('rede');}});
  await assert.rejects(unavailable.lookup(isbn),error=>error.status===503&&!error.message.includes('rede'));
});
test('sinopse e campos ausentes não são inventados e capa ausente não usa imagem em branco',async()=>{
  const {instance}=service({openBook:{title:'Título conhecido'},edition:{},work:{}});
  const data=await instance.lookup(isbn);assert.equal(data.sinopse,'');assert.equal(data.imagemUrl,'');assert.ok(data.camposAusentes.includes('sinopse'));assert.ok(data.camposAusentes.includes('capa'));assert.equal(data.ano,null);
});
test('imagem não pode redirecionar ao localhost e erro de capa preserva metadados',async()=>{
  const {instance,calls}=service({coverFetch:()=>new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}})});
  const data=await instance.lookup(isbn);assert.equal(data.titulo,book.title);assert.equal(data.imagemUrl,'');
  assert.ok(calls.every(call=>!call.url.includes('127.0.0.1')));
});
test('HTML disfarçado de imagem e arquivo acima do limite não são publicados',async()=>{
  for(const response of [new Response('<html>erro</html>',{headers:{'content-type':'text/html'}}),new Response(image,{headers:{'content-type':'image/jpeg','content-length':String(6*1024*1024)}})]){
    const {instance}=service({coverFetch:()=>response});const data=await instance.lookup(isbn);assert.equal(data.imagemUrl,'');
  }
});
test('segue o redirecionamento oficial da Open Library até o arquivo de capas do Internet Archive',async()=>{
  const {instance}=service({coverFetch:url=>url.hostname==='covers.openlibrary.org'?new Response(null,{status:302,headers:{location:'https://archive.org/download/l_covers_0008/l_covers_0008_43.zip/0008436965-L.jpg'}}):url.hostname==='archive.org'?new Response(null,{status:302,headers:{location:'https://ia802809.us.archive.org/view_archive.php?archive=/18/items/l_covers_0008/l_covers_0008_43.zip&file=0008436965-L.jpg'}}):new Response(image,{headers:{'content-type':'image/jpeg'}})});
  assert.ok((await instance.lookup(isbn)).imagemUrl);assert.equal((await sharp(await instance.cover(isbn)).metadata()).format,'webp');
});
test('não permite outros caminhos ou serviços arbitrários no Internet Archive',async()=>{
  const {instance,calls}=service({coverFetch:()=>new Response(null,{status:302,headers:{location:'https://archive.org/services/proxy?url=http://127.0.0.1'}})});
  assert.equal((await instance.lookup(isbn)).imagemUrl,'');assert.ok(!calls.some(call=>new URL(call.url).hostname==='archive.org'));
});
test('capa cacheada continua disponível após expirar metadados e cair a fonte externa',async()=>{
  let clock=0,offline=false;const {instance,calls}=service({clock:()=>clock,offline:()=>offline});
  await instance.lookup(isbn);const before=calls.length;clock=3600001;offline=true;
  assert.equal((await sharp(await instance.cover(isbn)).metadata()).format,'webp');assert.equal(calls.length,before,'Capa válida não requer nova consulta bibliográfica');
});
