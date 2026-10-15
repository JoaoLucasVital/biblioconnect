import {orderOperation,readIdempotentOrder} from "../services/idempotencyService.js";
const projections={
  compra:body=>({livroId:Number(body.livroId),modalidadeEntrega:body.modalidadeEntrega??"retirada",enderecoEntrega:body.modalidadeEntrega==="entrega"?body.enderecoEntrega:undefined}),
  aluguel:body=>({livroId:Number(body.livroId),dias:Number(body.dias)}),
  reserva:body=>({livroId:Number(body.livroId),dataRetirada:body.dataRetirada}),
};
export function orderIdempotency(prisma,scope){return async(req,res,next)=>{
  try{
    // Older clients remain compatible; the current UI always supplies a key.
    const key=req.get("Idempotency-Key");if(key===undefined)return next();
    req.orderOperation=orderOperation({usuarioId:Number(req.usuario.id),scope,key,input:projections[scope](req.body||{})});
    const previous=await readIdempotentOrder(prisma,req.orderOperation);
    if(previous){res.set("Idempotency-Replayed","true");return res.json(previous);}
    next();
  }catch(error){res.status(error.status||500).json({erro:error.status?error.message:"Não foi possível verificar esta operação."});}
};}
