import {Router} from 'express';
import {createHash} from 'node:crypto';

export function createIsbnRoutes({authenticate,admin,rateLimit,service,baseUrl}){
  const router=Router();
  const fail=(res,error)=>res.set('Cache-Control','no-store').status([400,404].includes(error.status)?error.status:503).json({erro:error.status===400?'Informe um ISBN-10 ou ISBN-13 válido.':error.status===404?'Capa não encontrada para este ISBN.':'Não foi possível consultar as fontes de livros agora. Tente novamente.'});
  router.get('/isbn/:isbn/capa',rateLimit('isbn-cover',{limit:240,windowMs:60000}),async(req,res)=>{
    try{
      const bytes=await service.cover(req.params.isbn),etag='"'+createHash('sha256').update(bytes).digest('hex')+'"';
      res.set({'Content-Type':'image/webp','Cache-Control':'public, max-age=3600, s-maxage=86400','ETag':etag,'X-Content-Type-Options':'nosniff'});
      if(req.headers['if-none-match']===etag)return res.status(304).end();
      res.send(bytes);
    }catch(error){fail(res,error);}
  });
  router.get('/isbn/:isbn',authenticate,admin,rateLimit('isbn-lookup',{limit:30,windowMs:60000,key:req=>String(req.usuario?.id)}),async(req,res)=>{
    res.set('Cache-Control','no-store');
    try{
      const book=await service.lookup(req.params.isbn);
      if(!book)return res.status(404).json({erro:'ISBN não encontrado nas fontes consultadas. Confira os números ou preencha os dados manualmente.'});
      res.json({...book,imagemUrl:book.imagemUrl?`${baseUrl.replace(/\/$/,'')}/isbn/${book.isbn}/capa`:''});
    }catch(error){fail(res,error);}
  });
  return router;
}
