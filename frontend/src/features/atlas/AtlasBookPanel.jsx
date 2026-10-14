import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import BookCover from "../../components/ui/BookCover.jsx";
import { formatarMoeda } from "../catalog/format.js";

export default function AtlasBookPanel({livro}) {
  if(!livro)return null;
  const available=livro.disponivel && Number(livro.estoque)>0;
  return <section className="atlas-book-panel" aria-label="Livro selecionado">
    <div className="atlas-panel-heading"><span>EM FOCO</span><ArrowUpRight size={17} aria-hidden="true"/></div>
    <div className="atlas-panel-cover"><BookCover livro={livro} className="w-28 shadow-xl sm:w-32"/></div>
    <p className="atlas-eyebrow">{livro.categoria||"Sem categoria"}{livro.ano?` / ${livro.ano}`:""}</p>
    <h2 className="atlas-book-title">{livro.titulo}</h2>
    <p className="atlas-book-author">{livro.autor}</p>
    <p className="atlas-stock"><span aria-hidden="true" className={available?"atlas-stock-dot":"atlas-stock-dot is-empty"}/>{available?`${Number(livro.estoque)} ${Number(livro.estoque)===1?"exemplar disponível":"exemplares disponíveis"}`:"Sem estoque no momento"}</p>
    {livro.sinopse && <details className="atlas-synopsis"><summary>Sobre esta leitura</summary><p>{livro.sinopse}</p></details>}
    <dl className="atlas-book-prices"><div><dt>Compra</dt><dd>{Number(livro.precoCompra)>0?formatarMoeda(livro.precoCompra):"Não disponível"}</dd></div><div><dt>Aluguel</dt><dd>{Number(livro.precoAluguel)>0?formatarMoeda(livro.precoAluguel):"Não disponível"}</dd></div></dl>
    <Link to="/livros" className="atlas-catalog-link">Consultar no catálogo<ArrowUpRight size={16} aria-hidden="true"/></Link>
  </section>;
}
