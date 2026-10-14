import {useCallback,useEffect,useState} from "react";
import {Link} from "react-router-dom";
import api from "../../api/api.js";
import BookCover from "../../components/ui/BookCover.jsx";
import Button from "../../components/ui/Button.jsx";
import BookSave from "./BookSave.jsx";
import useFavorites from "./useFavorites.js";
function SavedBook({livro,onSaved}){
  const favorite=useFavorites(livro.id);
  if(favorite.total!==null&&!favorite.salvo&&!favorite.pending)return null;
  return <article className="grid min-w-0 gap-3"><Link to={`/livros?busca=${encodeURIComponent(livro.titulo)}#catalogo`}><BookCover livro={livro} className="w-full max-w-40 shadow-lg"/><h3 className="mt-4 font-display text-xl leading-snug">{livro.titulo}</h3></Link><p className="text-sm text-muted">{livro.autor}</p><BookSave livro={livro} onSaved={onSaved}/></article>;
}
export default function SavedBooks(){
  const [page,setPage]=useState(1),[data,setData]=useState({itens:[],total:0,pages:0}),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{const {data}=await api.get("/me/salvos",{params:{page}});setData({itens:Array.isArray(data.itens)?data.itens:[],total:data.total||0,pages:data.pages||0});}
    catch{setError("Não foi possível carregar seus livros salvos.");}finally{setLoading(false);}
  },[page]);
  useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(active)load();});return()=>{active=false;};},[load]);
  return <section className="mt-16 border-t border-stroke pt-8" aria-labelledby="profile-saved"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-xs uppercase tracking-widest text-muted">PARA DEPOIS DO ÚLTIMO CAPÍTULO</p><h2 id="profile-saved" className="font-display text-3xl">Seus livros salvos</h2></div><Button variant="ghost" onClick={load} disabled={loading}>Atualizar salvos</Button></div>
    {loading?<p className="text-sm text-muted">Carregando suas leituras…</p>:error?<p className="text-sm text-muted" aria-live="polite">{error}</p>:data.itens.length?<div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">{data.itens.map(livro=><SavedBook key={livro.id} livro={livro} onSaved={load}/>)}</div>:<p className="max-w-lg text-sm leading-relaxed text-muted">Seu próximo capítulo ainda está por aqui. <Link to="/livros" className="underline underline-offset-4">Explore o catálogo</Link> e toque no coração para guardar suas escolhas.</p>}
    {data.pages>1&&<nav className="mt-8 flex items-center justify-center gap-4" aria-label="Páginas de livros salvos"><Button variant="ghost" disabled={page===1||loading} onClick={()=>setPage(value=>value-1)}>Anterior</Button><span className="text-sm">{page} de {data.pages}</span><Button variant="ghost" disabled={page===data.pages||loading} onClick={()=>setPage(value=>value+1)}>Próxima</Button></nav>}
  </section>;
}
