import {Router} from "express";
import {setSaved,favoriteSummary,favoriteEvents} from "../services/favoritesService.js";
function parseIds(raw){
  if(typeof raw!=="string"||raw.length>550)throw Object.assign(new Error("Selecione até 50 livros."),{status:400});
  const values=raw.split(",");if(values.length>50||values.some(value=>!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<1))throw Object.assign(new Error("Lista de livros inválida."),{status:400});
  return [...new Set(values.map(Number))];
}
function parseCursor(value){if(typeof value!=="string"||!/^\d{1,19}$/.test(value)||BigInt(value)>9223372036854775807n)throw Object.assign(new Error("Cursor inválido."),{status:400});return BigInt(value);}
export function createFavoritesRoutes({prisma,auth,pollMs=1000,lifetimeMs=45000,heartbeatMs=15000}){
  const router=Router();
  router.put("/livros/:id/salvo",auth.authenticate,auth.rateLimit("favorite-user",{limit:60,windowMs:60000,key:req=>req.usuario.id}),async(req,res,next)=>{
    try{const livroId=Number(req.params.id);if(!Number.isSafeInteger(livroId)||livroId<1)return res.status(400).json({erro:"Livro inválido."});res.json(await setSaved(prisma,{usuarioId:req.usuario.id,livroId,salvo:req.body.salvo}));}
    catch(error){if(error.status)return res.status(error.status).json({erro:error.message});next(error);}
  });
  router.get("/livros/salvos/resumo",auth.optional,async(req,res,next)=>{
    try{const ids=parseIds(req.query.ids);res.set("Cache-Control","private, no-store").json(await favoriteSummary(prisma,{ids,usuarioId:req.usuario?.id}));}
    catch(error){if(error.status)return res.status(error.status).json({erro:error.message});next(error);}
  });
  router.get("/me/salvos",auth.authenticate,async(req,res,next)=>{
    try{
      const page=Number(req.query.page||1);if(!Number.isSafeInteger(page)||page<1||page>10000)return res.status(400).json({erro:"Página inválida."});
      const [rows,total]=await prisma.$transaction([prisma.favorito.findMany({where:{usuarioId:req.usuario.id},orderBy:[{createdAt:"desc"},{id:"desc"}],skip:(page-1)*20,take:20,include:{livro:true}}),prisma.favorito.count({where:{usuarioId:req.usuario.id}})]);
      res.json({itens:rows.map(row=>row.livro),total,page,pages:Math.ceil(total/20)});
    }catch(error){next(error);}
  });
  router.get("/livros/salvos/eventos",async(req,res)=>{
    let ids,cursor;
    try{ids=parseIds(req.query.ids);cursor=parseCursor(req.headers["last-event-id"]||req.query.cursor||"0");}catch(error){return res.status(400).json({erro:error.message});}
    res.set({"Content-Type":"text/event-stream","Cache-Control":"no-cache, no-transform","Connection":"keep-alive","X-Accel-Buffering":"no"});res.flushHeaders();
    let stopped=false,poll,heartbeat,lifetime;
    const stop=()=>{if(stopped)return;stopped=true;clearTimeout(poll);clearInterval(heartbeat);clearTimeout(lifetime);res.end();};
    res.on("close",stop);
    function send(event,data,id){if(stopped)return;if(!res.write(`${id!==undefined?`id: ${id}\n`:""}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))stop();}
    async function snapshot(){const result=await favoriteSummary(prisma,{ids});cursor=BigInt(result.cursor);send("snapshot",{itens:result.itens.map(({livroId,total})=>({livroId,total})),cursor:result.cursor},result.cursor);}
    async function tick(){
      if(stopped)return;
      try{const result=await favoriteEvents(prisma,{ids,cursor});if(result.reset)await snapshot();else for(const event of result.eventos){cursor=BigInt(event.cursor);send("favorite",event,event.cursor);}}
      catch{stop();}
      if(!stopped)poll=setTimeout(tick,pollMs);
    }
    try{
      await snapshot();if(stopped)return;res.write("retry: 1000\n\n");poll=setTimeout(tick,pollMs);heartbeat=setInterval(()=>{if(!res.write(": heartbeat\n\n"))stop();},heartbeatMs);lifetime=setTimeout(stop,lifetimeMs);
    }catch{stop();}
  });
  return router;
}
