import {Router} from "express";
import {timingSafeEqual} from "node:crypto";
export function createCronRoutes({run,secret=process.env.CRON_SECRET}){
  const router=Router();
  router.get("/internal/cron",async(req,res)=>{
    res.set("Cache-Control","no-store");
    const supplied=Buffer.from(req.get("authorization")||""),expected=Buffer.from(`Bearer ${secret||""}`);
    if(Buffer.byteLength(secret||"")<32||supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return res.status(401).json({erro:"Não autorizado."});
    try{res.json(await run());}catch{res.status(503).json({erro:"Não foi possível concluir as rotinas agora."});}
  });
  return router;
}
