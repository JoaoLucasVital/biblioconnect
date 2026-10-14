import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import BookCover from "../../components/ui/BookCover.jsx";
import Button from "../../components/ui/Button.jsx";
import SceneBoundary from "./SceneBoundary.jsx";
import useHeroMotion from "./useHeroMotion.js";
import useMediaQuery from "./useMediaQuery.js";
const BookScene=lazy(()=>import("./BookScene.jsx"));
export default function EditorialHero({livro,destaques,selectedIndex,onSelect,accountAction,loading=false}) {
  const ref=useRef(null);
  const desktop=useMediaQuery("(min-width: 768px)");
  const reduced=useMediaQuery("(prefers-reduced-motion: reduce)");
  const [hidden,setHidden]=useState(()=>document.hidden);
  const [focused,setFocused]=useState(false);
  const [hovered,setHovered]=useState(false);
  const [manualPause,setManualPause]=useState(false);
  const [failedCover,setFailedCover]=useState(null);
  const unavailable=useCallback(()=>setFailedCover(livro?.imagemUrl),[livro?.imagemUrl]);
  const paused=hidden || focused || hovered || manualPause || reduced;
  useHeroMotion(ref,{enabled:!reduced});
  useEffect(()=>{
    const update=()=>setHidden(document.hidden);
    document.addEventListener("visibilitychange",update);
    return ()=>document.removeEventListener("visibilitychange",update);
  },[]);
  useEffect(()=>{
    if(paused || destaques.length<2)return;
    const timeout=setTimeout(()=>onSelect((selectedIndex+1)%destaques.length),6000);
    return ()=>clearTimeout(timeout);
  },[paused,destaques.length,selectedIndex,onSelect]);
  const select=index=>{setManualPause(true);onSelect(index);};
  const cover=<div className="grid h-full place-items-center"><BookCover livro={livro} className="mx-auto w-44 shadow-xl sm:w-52"/></div>;
  const scene=desktop && !reduced && livro?.imagemUrl && failedCover!==livro.imagemUrl;
  return <section ref={ref} aria-label="Descubra sua próxima leitura" onFocusCapture={()=>setFocused(true)}
    onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false);}}
    onPointerEnter={event=>{if(event.pointerType==="mouse")setHovered(true);}} onPointerLeave={()=>setHovered(false)}
    className="grid gap-10 py-12 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-12 md:py-16">
    <div><p data-hero-detail className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.17em] text-muted"><span className="h-px w-9 bg-accent" aria-hidden="true"/>Biblioteca online</p>
      <h1 className="font-display text-[clamp(3.2rem,7vw,6.1rem)] font-normal leading-[1.04] tracking-[-0.045em]"><span data-hero-line className="block">Encontre a sua</span><span data-hero-line className="block">próxima <span className="text-accent-hover dark:text-accent">leitura.</span></span></h1>
      <div data-hero-detail><p className="mt-6 max-w-sm text-base leading-relaxed text-muted sm:text-lg">Histórias para descobrir, ideias para levar com você. Explore o acervo e escolha como quer ler.</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"><Link to="/livros" className="bc-button inline-flex min-h-12 items-center gap-3 rounded bg-accent px-5 font-medium text-[#1e293b] hover:bg-accent-hover">Ver catálogo<ArrowUpRight size={19} aria-hidden="true"/></Link><Link to={accountAction.to} className="inline-flex min-h-12 items-center border-b border-ink text-sm font-medium">{accountAction.label}</Link></div>
      </div>
    </div>
    <div data-hero-detail className="min-w-0">
      <div className="relative grid h-80 place-items-center overflow-hidden bg-soft md:h-[420px]">
        <span aria-hidden="true" className="absolute left-5 top-5 text-[11px] uppercase tracking-[0.17em] text-muted">Leitura em destaque</span>
        {loading ? <p role="status" className="text-sm text-muted">Carregando leituras...</p> : livro ? (scene ? <div className="h-full w-full"><SceneBoundary key={livro.imagemUrl} fallback={cover}><Suspense fallback={cover}><BookScene livro={livro} active={!hidden} onUnavailable={unavailable}/></Suspense></SceneBoundary></div> : cover) : <div className="max-w-60 px-5 text-center"><p className="font-display text-2xl">Nenhum livro disponível ainda</p><p className="mt-3 text-sm text-muted">As novas leituras aparecerão aqui quando forem liberadas no acervo.</p></div>}
      </div>
      {livro && <div className="mt-5 flex items-start justify-between gap-5"><div className="min-w-0"><p className="mb-1 text-xs text-muted">{livro.categoria} · {String(selectedIndex+1).padStart(2,"0")} / {String(destaques.length).padStart(2,"0")}</p><h2 className="wrap-anywhere font-display text-2xl leading-tight">{livro.titulo}</h2><p className="mt-1 text-sm text-muted">{livro.autor}</p></div>
      {destaques.length>1 && <div className="flex shrink-0 gap-1"><Button variant="secondary" className="px-2" aria-label="Destaque anterior" onClick={()=>select((selectedIndex+destaques.length-1)%destaques.length)}><ArrowLeft size={18} aria-hidden="true"/></Button><Button variant="secondary" className="px-2" aria-label="Próximo destaque" onClick={()=>select((selectedIndex+1)%destaques.length)}><ArrowRight size={18} aria-hidden="true"/></Button></div>}</div>}
      {destaques.length>1 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-1">{destaques.map((book,index)=><button key={book.id} type="button" onClick={()=>select(index)} aria-label={`Ir para ${book.titulo}`} aria-pressed={index===selectedIndex} className="grid h-11 w-8 place-items-center"><span aria-hidden="true" className={`h-1 w-5 ${index===selectedIndex?"bg-ink":"bg-muted/40"}`}/></button>)}</div>
        {!reduced && <Button variant="ghost" className="px-2 text-xs" aria-label={manualPause?"Retomar destaques":"Pausar destaques"} onClick={()=>setManualPause(value=>!value)}>{manualPause?<Play size={14} aria-hidden="true"/>:<Pause size={14} aria-hidden="true"/>}{manualPause?"Retomar":"Pausar"}</Button>}
      </div>}
    </div>
  </section>;
}
