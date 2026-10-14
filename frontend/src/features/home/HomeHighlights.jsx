import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import BookCover from "../../components/ui/BookCover.jsx";
import { formatarMoeda } from "../catalog/format.js";
export default function HomeHighlights({livros}) {
  if(!livros.length)return null;
  return <section className="py-14 sm:py-20" aria-labelledby="home-selecao"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">No acervo</p><h2 id="home-selecao" className="font-display text-3xl sm:text-4xl">Leituras para conhecer</h2></div><Link to="/livros" className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">Explorar o acervo<ArrowUpRight size={16} aria-hidden="true"/></Link></div>
    <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">{livros.slice(0,4).map(livro=><article key={livro.id} className="min-w-0"><div className="mb-5 grid min-h-64 place-items-center bg-soft p-6"><BookCover livro={livro} className="w-32 shadow-lg"/></div><p className="mb-2 text-xs text-muted">{livro.categoria}</p><h3 className="wrap-anywhere font-display text-xl leading-snug">{livro.titulo}</h3><p className="mt-1 text-sm text-muted">{livro.autor}</p><p className="mt-3 text-sm">Compra {formatarMoeda(livro.precoCompra)} <span className="text-muted">· Aluguel {formatarMoeda(livro.precoAluguel)}</span></p></article>)}</div>
  </section>;
}
