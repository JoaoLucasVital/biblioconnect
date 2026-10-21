import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import {createIsbnRoutes} from '../src/routes/isbnRoutes.js';
test('metadados restritos, imagem pública cacheável e erros sem detalhes de provedor',async()=>{
  const app=express();let broken=false;
  app.use(createIsbnRoutes({baseUrl:'https://library.example/api',authenticate:(req,res,next)=>req.headers.authorization==='admin'?next():res.status(401).end(),admin:(req,res,next)=>next(),rateLimit:()=>((req,res,next)=>next()),service:{lookup:async isbn=>{if(broken)throw Object.assign(Error('chave interna'),{status:503});return {isbn,titulo:'Livro',imagemUrl:'https://covers.openlibrary.org/b/id/1-L.jpg'};},cover:async()=>Buffer.from('cover')}}));
  const server=http.createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await fetch(base+'/isbn/9788532530783')).status,401);
    const metadata=await fetch(base+'/isbn/9788532530783',{headers:{authorization:'admin'}});assert.equal(metadata.status,200);assert.equal((await metadata.json()).imagemUrl,'https://library.example/api/isbn/9788532530783/capa');
    const cover=await fetch(base+'/isbn/9788532530783/capa');assert.equal(cover.status,200);assert.equal(cover.headers.get('content-type'),'image/webp');assert.match(cover.headers.get('cache-control'),/public/);
    const same=await fetch(base+'/isbn/9788532530783/capa',{headers:{'if-none-match':cover.headers.get('etag')}});assert.equal(same.status,304);
    broken=true;const failure=await fetch(base+'/isbn/9788532530783',{headers:{authorization:'admin'}});assert.equal(failure.status,503);assert.ok(!(await failure.text()).includes('chave interna'));
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
