import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import BookCover from "../../components/ui/BookCover.jsx";
import BookSave from "../community/BookSave.jsx";
import { formatarMoeda } from "../catalog/format.js";
export default function HomeHighlights({livros}) {
  if(!livros.length)return null;
  return <section id="leituras" className="py-14 sm:py-20" aria-labelledby="home-selecao"><div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">Escolhas do acervo</p><h2 id="home-selecao" className="font-display text-4xl leading-tight tracking-[-.035em] sm:text-5xl">Só mais <em>um capítulo.</em></h2><p className="mt-4 max-w-md text-sm text-muted">Para se apaixonar, perder o fôlego ou desconfiar de todo mundo. Comece pela capa.</p></div><Link to="/livros" className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">Explorar o acervo<ArrowUpRight size={16} aria-hidden="true"/></Link></div>
    <div className="home-highlights-grid">{livros.slice(0,8).map((livro,index)=><article key={livro.id} className="min-w-0"><Link to={`/livros?busca=${encodeURIComponent(livro.titulo)}#catalogo`} className="discovery-cover-stage mb-5" aria-label={`Encontrar ${livro.titulo} no catálogo`}><span className="home-highlight-index" aria-hidden="true">{String(index+1).padStart(2,"0")}</span><BookCover livro={livro} className="discovery-cover"/></Link><BookSave livro={livro}/><p className="home-genre mb-3">{livro.categoria}</p><h3 className="wrap-anywhere font-display text-2xl leading-snug">{livro.titulo}</h3><p className="mt-1 text-sm text-muted">{livro.autor}</p><p className="mt-3 text-sm">Compra {formatarMoeda(livro.precoCompra)} <span className="text-muted">· Aluguel {formatarMoeda(livro.precoAluguel)}</span></p></article>)}</div>
  </section>;
}
