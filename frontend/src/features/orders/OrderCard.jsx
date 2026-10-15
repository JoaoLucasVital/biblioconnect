import {Link} from "react-router-dom";
import {ArrowUpRight,CheckCircle2,Clock3,Truck,MapPin,ReceiptText,Star,MessageCircle} from "lucide-react";
import BookCover from "../../components/ui/BookCover.jsx";
import Button from "../../components/ui/Button.jsx";
import {formatarMoeda} from "../catalog/format.js";
const date=value=>value?new Date(value).toLocaleDateString("pt-BR"):"A confirmar";
const statusLabels={pendente:"Em andamento",concluido:"Concluído",devolvido:"Devolvido",cancelado:"Cancelado"};
const paymentLabels={pendente:"Pagamento pendente",pago:"Pagamento aprovado",cancelado:"Pagamento cancelado",estornado:"Pagamento estornado"};
const actionClass="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted underline-offset-4 transition-colors hover:text-ink hover:underline";

export default function OrderCard({pedido,busy,onPagar,onEstender,onCancelar}){
  const paid=pedido.statusPagamento==="pago",cancelled=pedido.status==="cancelado",delivery=pedido.modalidadeEntrega==="entrega";
  const needsPayment=!paid&&!cancelled&&Number(pedido.valor)>0;
  const deliveryStatus=paid&&pedido.statusEntrega==="aguardando_pagamento"?"Pagamento recebido · entrega pendente":pedido.statusEntrega?.replaceAll("_"," ")||"Aguardando atualização";
  return <article aria-label={`Pedido ${pedido.id} — ${pedido.livro?.titulo||"Livro indisponível"}`} className="min-w-0 overflow-hidden rounded-lg border border-stroke bg-surface">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke bg-soft/50 px-5 py-3 sm:px-6"><p className="text-[11px] uppercase tracking-[0.12em] text-muted">Pedido <strong className="font-semibold text-ink">#{String(pedido.id).padStart(4,"0")}</strong><span className="mx-2 opacity-50">/</span>{date(pedido.createdAt)}</p><span className="inline-flex items-center gap-2 text-xs font-medium"><span className={`size-1.5 rounded-full ${cancelled?"bg-muted":"bg-accent"}`} aria-hidden="true"/>{statusLabels[pedido.status]||pedido.status}</span></header>
    <div className="grid gap-5 p-5 sm:p-6">
      <div className="grid grid-cols-[76px_minmax(0,1fr)] items-start gap-5 sm:grid-cols-[88px_minmax(0,1fr)_auto]">
        <BookCover livro={pedido.livro||{}} className="w-full rounded-sm shadow-md"/>
        <div className="min-w-0 py-1"><p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-muted">{pedido.livro?.categoria||"Seu acervo"}</p><h3 className="wrap-anywhere font-display text-xl leading-snug sm:text-2xl">{pedido.livro?.titulo||"Livro não encontrado"}</h3><p className="mt-2 text-sm text-muted">{pedido.livro?.autor||"Autor não informado"}</p><p className="mt-4 flex items-center gap-2 text-xs font-medium">{paid?<CheckCircle2 size={15} aria-hidden="true"/>:<Clock3 size={15} aria-hidden="true"/>}{paymentLabels[pedido.statusPagamento]||"Pagamento pendente"}</p></div>
        <div className="col-start-2 sm:col-start-auto sm:py-1 sm:pl-5 sm:text-right"><p className="text-[10px] uppercase tracking-widest text-muted">Total do pedido</p><strong className="mt-1 block text-2xl font-semibold tracking-tight tabular-nums">{formatarMoeda(pedido.valor)}</strong>{delivery&&<p className="mt-2 text-xs text-muted">inclui {formatarMoeda(pedido.valorEntrega)} de frete</p>}</div>
      </div>
      <dl className="grid gap-5 border-t border-stroke pt-5 text-sm sm:grid-cols-3">
        <div><dt className="mb-2 text-xs text-muted">Recebimento</dt><dd className="flex items-center gap-2 font-medium">{delivery?<Truck size={16} aria-hidden="true"/>:<MapPin size={16} aria-hidden="true"/>}{delivery?"Entrega no endereço":"Retirada na biblioteca"}</dd></div>
        {delivery?<div className="sm:col-span-2"><dt className="mb-2 text-xs text-muted">Entrega</dt><dd className="wrap-anywhere text-sm first-letter:uppercase">{deliveryStatus}</dd></div>:<div><dt className="mb-2 text-xs text-muted">Retirar até</dt><dd className="font-medium">{date(pedido.retiradaLimite)}</dd></div>}
        {pedido.tipo==="aluguel"&&<div><dt className="mb-2 text-xs text-muted">Devolver até</dt><dd className="font-medium">{date(pedido.devolucaoPrevista)}<span className="ml-2 text-xs font-normal text-muted">{pedido.diasAluguel} dias</span></dd></div>}
      </dl>
    </div>
    <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-stroke px-5 py-3 sm:px-6">
      {needsPayment&&<Button disabled={busy} onClick={()=>onPagar(pedido)}>Pagar pedido<ArrowUpRight size={16} aria-hidden="true"/></Button>}
      <Link to={`/pedido-confirmado/${pedido.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline">Detalhes e pagamento<ArrowUpRight size={16} aria-hidden="true"/></Link>
      <Link to={`/comprovante/${pedido.id}`} className={actionClass}><ReceiptText size={15} aria-hidden="true"/>Comprovante</Link>
      {pedido.tipo==="aluguel"&&paid&&pedido.status==="pendente"&&<Button variant="ghost" onClick={()=>onEstender(pedido)}>Estender aluguel</Button>}
      {!cancelled&&<Link to={`/livros/${pedido.livroId}/avaliacoes`} className={actionClass}><Star size={15} aria-hidden="true"/>Avaliar livro</Link>}
      {pedido.status==="pendente"&&!(paid&&Number(pedido.valor)>0)&&<Button variant="ghost" onClick={()=>onCancelar(pedido)}>Cancelar pedido</Button>}
      {paid&&Number(pedido.valor)>0&&!cancelled&&<Link to="/chat" className={actionClass}><MessageCircle size={15} aria-hidden="true"/>Pedir cancelamento/estorno</Link>}
    </footer>
  </article>;
}
