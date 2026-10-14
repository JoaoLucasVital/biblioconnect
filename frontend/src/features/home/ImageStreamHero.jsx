import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import BookCover from "../../components/ui/BookCover.jsx";
import InteractiveHoverLink from "../../components/ui/InteractiveHoverLink.jsx";
import { ClickSpark } from "./DiscoveryMotion.jsx";
import { streamKeyframes } from "./streamGeometry.js";
import useMediaQuery from "./useMediaQuery.js";
import "./discovery.css";

export default function ImageStreamHero({livros=[]}) {
  const id=useId().replace(/[^a-zA-Z0-9]/g,"");
  const names=useMemo(()=>[`stream-right-${id}`,`stream-left-${id}`],[id]);
  const css=useMemo(()=>streamKeyframes(1,names[0])+streamKeyframes(-1,names[1]),[names]);
  const [hidden,setHidden]=useState(()=>document.hidden);
  const [offscreen,setOffscreen]=useState(false);
  const reduced=useMediaQuery("(prefers-reduced-motion: reduce)");
  const ref=useRef(null);
  useEffect(()=>{
    const update=()=>setHidden(document.hidden);
    document.addEventListener("visibilitychange",update);
    const observer=window.IntersectionObserver?new IntersectionObserver(([entry])=>setOffscreen(!entry.isIntersecting)):null;
    if(observer)observer.observe(ref.current);
    return ()=>{document.removeEventListener("visibilitychange",update);observer?.disconnect();};
  },[]);
  const books=livros.slice(0,12),cards=Math.max(9,books.length);
  return <section ref={ref} className="image-stream-hero" aria-label="Histórias em movimento" data-paused={hidden||offscreen||reduced}>
    <style>{css}</style>
    <div className="stream-heading"><p className="discovery-eyebrow"><span/>Para quem fica só mais um capítulo</p><h1>Sua próxima <br/><em>obsessão literária.</em></h1><p>Romances intensos, mundos impossíveis e mistérios que não deixam dormir.</p></div>
    {books.length>0 && <div className="stream-perspective" aria-hidden="true"><div className="stream-rails">{names.map((name,side)=>Array.from({length:cards},(_,index)=>{
      const book=books[(index+side*3)%books.length];
      return <div key={`${name}-${index}`} className="stream-book" data-book-id={book.id} style={{animationName:name,animationDelay:`${-index*26/cards}s`}}><BookCover livro={book} className="h-full w-full" sizes="(min-width: 768px) 28vw, 45vw" priority={side===0 && index===0}/></div>;
    }))}</div></div>}
    <div className="stream-footer"><div className="stream-caption"><span className="stream-caption-line"/><p>Histórias para sentir.<br/><strong>Capas para descobrir.</strong></p></div><ClickSpark><InteractiveHoverLink to="/livros">Explorar leituras</InteractiveHoverLink></ClickSpark><div className="stream-controls"><a href="#leituras" aria-label="Ver leituras em destaque"><ArrowDown size={17}/></a></div></div>
    {!books.length && <p className="stream-empty">Nenhum livro disponível ainda</p>}
    <div className="stream-accessible-books sr-only"><p>Capas da seleção do acervo:</p><ul>{books.map(book=><li key={book.id}>{book.titulo}, de {book.autor}</li>)}</ul></div>
  </section>;
}
