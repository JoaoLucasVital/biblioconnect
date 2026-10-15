import {formatarMoedaEmail} from "../utils/orderUtils.js";
export function createRuntimeJobs({prisma,enviarNotificacao,calcularMultaPedido,clock=()=>new Date()}){
  async function run(){
    const now=clock(),limite=new Date(+now-24*3600000);
    const pedidos=await prisma.pedido.findMany({where:{status:"pendente",OR:[{tipo:"aluguel",devolucaoPrevista:{lt:now}},{tipo:"reserva",retiradaLimite:{lt:now}}],AND:[{OR:[{ultimaNotificacaoAtraso:null},{ultimaNotificacaoAtraso:{lt:limite}}]}]},include:{usuario:true,livro:true},take:100,orderBy:{id:"asc"}});
    let notified=0,failed=0;
    for(const pedido of pedidos){
      const claim=await prisma.pedido.updateMany({where:{id:pedido.id,status:"pendente",ultimaNotificacaoAtraso:pedido.ultimaNotificacaoAtraso},data:{ultimaNotificacaoAtraso:now}});
      if(!claim.count)continue;
      try{
        const sent=await enviarNotificacao({to:pedido.usuario.email,subject:"Pendência em atraso - BiblioConnect",titulo:"Existe uma pendência no seu pedido",mensagem:pedido.tipo==="aluguel"?"O prazo de devolução do aluguel venceu.":"O prazo da sua reserva venceu.",detalhes:[{label:"Livro",valor:pedido.livro.titulo},{label:"Multa atual",valor:formatarMoedaEmail(calcularMultaPedido(pedido))}]});
        if(sent!==true)throw new Error("Email não enviado.");
        notified++;
      }catch{
        failed++;
        await prisma.pedido.updateMany({where:{id:pedido.id,ultimaNotificacaoAtraso:now},data:{ultimaNotificacaoAtraso:pedido.ultimaNotificacaoAtraso}});
      }
    }
    const [events,limits,challenges,operations]=await prisma.$transaction([
      prisma.eventoFavorito.deleteMany({where:{createdAt:{lt:limite}}}),
      prisma.limiteOperacao.deleteMany({where:{expiresAt:{lt:now}}}),
      prisma.desafioGoogle.deleteMany({where:{expiresAt:{lt:now}}}),
      prisma.operacaoIdempotente.deleteMany({where:{expiresAt:{lt:new Date(+now-89*24*3600000)}}}),
    ]);
    return {notified,failed,cleaned:events.count+limits.count+challenges.count+operations.count};
  }
  function startLocal(){
    const execute=()=>run().catch(()=>console.error("Falha nas rotinas automáticas; será feita nova tentativa."));
    const first=setTimeout(execute,30000),interval=setInterval(execute,6*3600000);first.unref();interval.unref();
    return ()=>{clearTimeout(first);clearInterval(interval);};
  }
  return {run,startLocal};
}
