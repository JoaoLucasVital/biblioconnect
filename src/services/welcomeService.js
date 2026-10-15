export async function claimWelcome(prisma,usuarioId,now=new Date()){
  const result=await prisma.usuario.updateMany({where:{id:usuarioId,welcomeSeenAt:null},data:{welcomeSeenAt:now}});
  return {show:result.count===1};
}
