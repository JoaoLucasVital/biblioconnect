import {erroNegocio} from "./orderService.js";
const day=86400000;
export async function setSaved(prisma,{usuarioId,livroId,salvo}){
  if(typeof salvo!=="boolean")throw erroNegocio("Informe se deseja salvar o livro.");
  return prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "Livro" WHERE id = ${livroId} FOR UPDATE`;
    const book=await tx.livro.findUnique({where:{id:livroId},select:{disponivel:true}});
    if(!book||(salvo&&!book.disponivel))throw erroNegocio("Livro não encontrado.",404);
    const existing=await tx.favorito.findUnique({where:{usuarioId_livroId:{usuarioId,livroId}}});
    const changed=Boolean(existing)!==salvo;
    if(changed){if(salvo)await tx.favorito.create({data:{usuarioId,livroId}});else await tx.favorito.delete({where:{id:existing.id}});}
    const total=await tx.favorito.count({where:{livroId}});
    if(changed){const event=await tx.eventoFavorito.create({data:{livroId,total}});return {livroId,total,salvo,cursor:String(event.id)};}
    const latest=await tx.eventoFavorito.aggregate({_max:{id:true}});return {livroId,total,salvo,cursor:String(latest._max.id??0)};
  });
}
export async function favoriteSummary(prisma,{ids,usuarioId,now=new Date()}){
  return prisma.$transaction(async tx=>{
    const counts=await tx.favorito.groupBy({by:["livroId"],where:{livroId:{in:ids}},_count:{_all:true}});
    const mine=usuarioId?await tx.favorito.findMany({where:{usuarioId,livroId:{in:ids}},select:{livroId:true}}):[];
    const cursor=await tx.eventoFavorito.aggregate({_max:{id:true},where:{createdAt:{gte:new Date(+now-day)}}});
    return {itens:ids.map(livroId=>({livroId,total:counts.find(row=>row.livroId===livroId)?._count._all||0,salvo:mine.some(row=>row.livroId===livroId)})),cursor:String(cursor._max.id??0)};
  },{isolationLevel:"RepeatableRead"});
}
export async function favoriteEvents(prisma,{ids,cursor,now=new Date()}){
  const retained=await prisma.eventoFavorito.aggregate({_min:{id:true},_max:{id:true},where:{createdAt:{gte:new Date(+now-day)}}});
  if((retained._min.id!==null&&cursor<retained._min.id-1n)||cursor>(retained._max.id??0n))return {reset:true};
  const events=await prisma.eventoFavorito.findMany({where:{id:{gt:cursor},livroId:{in:ids},createdAt:{gte:new Date(+now-day)}},orderBy:{id:"asc"},take:200,select:{id:true,livroId:true,total:true}});
  return {reset:false,eventos:events.map(event=>({livroId:event.livroId,total:event.total,cursor:String(event.id)}))};
}
