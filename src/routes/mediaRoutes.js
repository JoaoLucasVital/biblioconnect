import express from 'express';
import {createBookMediaService} from '../services/bookMediaService.js';
export function createMediaRoutes({auth,service=createBookMediaService(),handlePresigned,env=process.env}={}){
  const router=express.Router();
  router.use('/media',auth.authenticate,(req,res,next)=>req.usuario?.role==='ADMIN'?next():res.status(403).json({erro:'Acesso restrito à administração.'}));
  router.use('/media',auth.rateLimit('book-media',{limit:60,windowMs:60000,key:req=>String(req.usuario.id)}));
  const fail=(res,error)=>res.status(error.status||503).json({erro:error.status===400?error.message:'Não foi possível enviar a capa agora. Tente novamente.'});
  router.post('/media/book-upload-ticket',auth.rateLimit('book-upload',{limit:30,windowMs:60000,key:req=>String(req.usuario.id)}),(req,res)=>{
    res.set('Cache-Control','no-store');try{res.json(service.prepare(Number(req.usuario.id)));}catch(error){fail(res,error);}
  });
  router.post('/media/book-upload-token',async(req,res)=>{
    res.set('Cache-Control','no-store');
    if(req.body?.type!=='blob.generate-presigned-url')return res.status(400).json({erro:'Solicitação de upload inválida.'});
    const payload=req.body.payload;
    if(typeof payload?.pathname!=='string'||payload.pathname.length>200||typeof payload.clientPayload!=='string'||payload.clientPayload.length>2048||payload.multipart===true)return res.status(400).json({erro:'Solicitação de upload inválida.'});
    try{
      const handle=handlePresigned||(await import('@vercel/blob/client')).handleUploadPresigned;
      res.json(await handle({request:req,body:req.body,webhookPublicKey:env.BLOB_PRIVATE_WEBHOOK_PUBLIC_KEY,getSignedToken:(pathname,ticket)=>service.authorize(Number(req.usuario.id),pathname,ticket)}));
    }catch(error){fail(res,error);}
  });
  router.post('/media/book-upload-finalize',async(req,res)=>{
    res.set('Cache-Control','no-store');try{res.json(await service.finalize(Number(req.usuario.id),req.body?.ticket));}catch(error){fail(res,error);}
  });
  return router;
}
