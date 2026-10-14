import { ArrowUpRight } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import BookCover from "../../components/ui/BookCover.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { formatarMoeda } from "./format.js";
export default function CatalogBookCard({livro,onComprar,onAlugar,onReservar,onAvaliacoes}) {
  const noStock = Number(livro.estoque)<=0;
  return <article className="grid min-w-0 grid-rows-[auto_1fr] border-b border-stroke pb-8">
    <div className="relative mb-5 flex min-h-80 items-center justify-center bg-soft p-6">
      <BookCover livro={livro} className="w-44 max-w-[85%] shadow-xl"/>
      {livro.destaque && <span className="absolute left-3 top-3"><StatusBadge>Destaque</StatusBadge></span>}
    </div>
    <div className="flex min-w-0 flex-col gap-4">
      <div><p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted">{livro.categoria}</p><h2 className="wrap-anywhere font-display text-2xl leading-tight">{livro.titulo}</h2><p className="mt-2 wrap-anywhere text-sm text-muted">{livro.autor}</p></div>
      <details className="text-sm text-muted"><summary className="min-h-8 cursor-pointer text-ink underline underline-offset-4">Sobre o livro</summary><p className="my-3 wrap-anywhere">{livro.sinopse || "Sinopse não informada."}</p><p>{livro.redator}{livro.ano ? ` · ${livro.ano}` : ""}</p></details>
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-stroke pt-4 text-sm"><p className="text-muted">Compra<strong className="mt-1 block text-lg font-semibold text-ink">{formatarMoeda(livro.precoCompra)}</strong></p><p className="text-muted">Aluguel<strong className="mt-1 block text-lg font-semibold text-ink">{formatarMoeda(livro.precoAluguel)}</strong></p></div>
      <p className="text-xs leading-relaxed text-muted">{livro.diasInclusos} dias inclusos · Extra: {formatarMoeda(livro.precoDiaExtra)}/dia<br/>Estoque: {livro.estoque}</p>
      <div className="grid grid-cols-2 gap-2"><Button onClick={()=>onComprar(livro)} disabled={noStock}>Comprar</Button><Button variant="secondary" onClick={()=>onAlugar(livro)} disabled={noStock}>Alugar</Button><Button variant="ghost" onClick={()=>onReservar(livro)} disabled={noStock || livro.isDoado}>Reservar</Button><Button variant="ghost" onClick={()=>onAvaliacoes(livro)}>Avaliações<ArrowUpRight size={15} aria-hidden="true"/></Button></div>
      {noStock && <p className="text-sm text-muted">Livro sem estoque.</p>}
      {livro.isDoado && <p className="text-sm text-muted">Livro doado: reserva bloqueada.</p>}
    </div>
  </article>;
}
