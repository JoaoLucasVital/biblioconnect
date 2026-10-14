import { useMemo, useState } from "react";
import { Compass, List, Search, X } from "lucide-react";
import { buildAtlas } from "./atlasModel.js";
import AtlasMap from "./AtlasMap.jsx";
import AtlasBookPanel from "./AtlasBookPanel.jsx";
import AtlasResults from "./AtlasResults.jsx";
import BookCover from "../../components/ui/BookCover.jsx";
import BookLoader from "../../components/ui/BookLoader.jsx";
import StatusMessage from "../../components/ui/StatusMessage.jsx";
import InteractiveHoverLink from "../../components/ui/InteractiveHoverLink.jsx";
import RevealText from "../../components/ui/RevealText.jsx";
import FadeInput from "../../components/ui/FadeInput.jsx";
import useMediaQuery from "../home/useMediaQuery.js";
import "./atlas.css";

export default function AtlasExplorer({livros=[],loading=false,error="",onRetry,headingAs="h1",embedded=false,onConsultBook}) {
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("");
  const [selectedId,setSelectedId]=useState(null);
  const [view,setView]=useState(null);
  const desktop=useMediaQuery("(min-width: 768px)");
  const reduced=useMediaQuery("(prefers-reduced-motion: reduce)");
  const model=useMemo(()=>buildAtlas(livros,{query,category}),[livros,query,category]);
  const selected=model.books.find(b=>b.id===selectedId)||model.books.find(b=>b.destaque)||model.books[0];
  const isMap=desktop && (view===null?!reduced:view==="map");
  const clear=()=>{setQuery("");setCategory("");};
  return <section className="atlas-explorer" aria-label="Atlas do Acervo">
    <div className="atlas-intro">
      <div><p className="atlas-eyebrow"><span aria-hidden="true"/>BIBLIOCONNECT / EXPLORE AS CONEXÕES</p><RevealText as={headingAs} className="atlas-title">Atlas do acervo.</RevealText></div>
      <div className="atlas-intro-note"><p>Cada livro abre<br/><em>um novo caminho.</em></p>{embedded?<a className="atlas-catalog-link" href="#catalogo">Ver todos os livros ↓</a>:<InteractiveHoverLink to="/livros">Abrir catálogo</InteractiveHoverLink>}</div>
    </div>
    <div className="atlas-toolbar">
      <label className="atlas-search"><Search size={19} aria-hidden="true"/><span className="sr-only">Buscar no Atlas</span><FadeInput type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Um título, um autor, uma descoberta…"/></label>
      <div className="atlas-view-control" role="group" aria-label="Visualização do acervo">
        {desktop && <button type="button" aria-pressed={isMap} onClick={()=>setView("map")}><Compass size={16} aria-hidden="true"/>Mapa</button>}
        <button type="button" aria-pressed={!isMap} onClick={()=>setView("list")}><List size={16} aria-hidden="true"/>Lista</button>
      </div>
    </div>
    {!loading && !error && <div className="atlas-category-bar" role="group" aria-label="Categorias do Atlas"><button type="button" aria-pressed={!category} onClick={()=>setCategory("")}>Todas <span>{livros.length}</span></button>{model.categories.map(c=><button key={c.key} type="button" aria-pressed={c.name===category} onClick={()=>setCategory(c.name)}>{c.name} <span>{c.count}</span></button>)}</div>}
    {loading?<div className="atlas-state"><BookLoader/></div>:error?<div className="atlas-state"><StatusMessage type="error" onRetry={onRetry}>{error}</StatusMessage></div>:livros.length===0?<div className="atlas-state"><Compass size={36} aria-hidden="true"/><h2>Nenhum livro disponível ainda</h2><p>As próximas leituras aparecerão neste mapa quando entrarem no acervo.</p></div>:<>
      <div className="atlas-workspace">
        <div className="atlas-map-area">
          {model.total===0?<div className="atlas-state"><Search size={30} aria-hidden="true"/><h2>Nenhuma leitura encontrada</h2><p>Experimente outro título, autor ou categoria.</p><button className="atlas-clear" type="button" onClick={clear}><X size={15} aria-hidden="true"/>Limpar busca</button></div>:isMap?<AtlasMap model={model} selectedId={selected?.id} onSelect={setSelectedId}/>:<ul className="atlas-book-list" aria-label="Livros no Atlas">{model.books.map(book=><li key={book.id}><button type="button" className={selected?.id===book.id?"is-selected":""} aria-pressed={selected?.id===book.id} aria-label={`Ver ${book.titulo}, de ${book.autor}`} onClick={()=>setSelectedId(book.id)}>
            <BookCover livro={book} className="w-10 shrink-0"/><span className="min-w-0"><strong>{book.titulo}</strong><small>{book.autor}</small></span><span className="atlas-list-category">{book.categoria||"Sem categoria"}</span>
          </button></li>)}</ul>}
          {(!isMap || model.total===0) && <AtlasResults total={model.total} visibleCount={model.visibleCount}/>}
        </div>
        <AtlasBookPanel livro={selected} embedded={embedded} onConsultBook={onConsultBook}/>
      </div>
      {model.books.length>0 && <div className="atlas-cover-strip" aria-label="Percorrer leituras">{model.books.slice(0,8).map((book,i)=><button type="button" key={book.id} onClick={()=>setSelectedId(book.id)} aria-pressed={selected?.id===book.id} aria-label={`Destacar ${book.titulo}`}>
        <span aria-hidden="true" className="atlas-cover-index">{String(i+1).padStart(2,"0")}</span><BookCover livro={book} className="w-10 shrink-0"/><span>{book.titulo}<small>{book.autor}</small></span>
      </button>)}</div>}
    </>}
  </section>;
}
