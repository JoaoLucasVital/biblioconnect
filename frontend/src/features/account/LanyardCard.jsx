import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import api from '../../api/api.js';
import useMediaQuery from '../home/useMediaQuery.js';
import {makeReaderTextures} from './card-texture.js';
import './lanyard-card.css';
const Lanyard=lazy(()=>import('./vendor/Lanyard.jsx'));
export default function LanyardCard({usuario}){
  const holder=useRef(null),[bounds,setBounds]=useState(null),[textures,setTextures]=useState(null);
  const reduced=useMediaQuery('(prefers-reduced-motion: reduce)');
  useEffect(()=>{
    const measure=()=>{const box=holder.current.getBoundingClientRect(),width=document.documentElement.clientWidth||window.innerWidth;setBounds({left:0,width,columnWidth:box.width,anchor:(box.left+box.width/2)/width});};
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;observer?.observe(holder.current);window.addEventListener('resize',measure);measure();
    return()=>{observer?.disconnect();window.removeEventListener('resize',measure);};
  },[]);
  useEffect(()=>{
    if(!window.WebGLRenderingContext)return;
    const controller=new AbortController();let active=true;
    async function prepare(){
      let blob;
      if(usuario.avatarUrl){try{blob=(await api.get(usuario.avatarUrl,{responseType:'blob',signal:controller.signal})).data;}catch{if(controller.signal.aborted)return;}}
      try{const result=await makeReaderTextures(usuario,blob);if(active)setTextures(result);}catch{if(active)setTextures(null);}
    }
    prepare();return()=>{active=false;controller.abort();};
  },[usuario]);
  return <div ref={holder} className="bc-lanyard-holder">{createPortal(<div className="bc-lanyard-frame" style={bounds?{left:bounds.left,width:bounds.width}:undefined}>
    <div className="bc-lanyard-fallback" style={bounds?{left:bounds.width*bounds.anchor,width:bounds.columnWidth}:undefined}><div className="bc-lanyard-fallback-cord"/><div className="bc-lanyard-fallback-card">{usuario.avatarUrl&&<img src={`${(import.meta.env.VITE_API_URL||'http://localhost:3000').replace(/\/$/,'')}${usuario.avatarUrl}`} alt="Sua foto de perfil"/>}<span className="text-xs uppercase tracking-widest">BiblioConnect</span><strong className="font-display text-2xl">{usuario.nome}</strong><span className="text-xs">BC-{String(usuario.id).padStart(5,'0')}</span></div></div>
    {bounds&&textures&&<Suspense fallback={null}><Lanyard frontImage={textures.front} backImage={textures.back} imageFit="contain" cardColor="#172e4d" strapColor="#e67e00" anchor={bounds.anchor} size={.56} strapLength={.65} breeze={reduced?0:.12} damping={.65} elasticity={.4} intro={!reduced} interactive={!reduced} finish="matte"/></Suspense>}
  </div>,document.body)}<div className="sr-only" aria-label="Cartão da biblioteca">{textures&&<span>{usuario.nome}</span>}<span>Identificação BC-{String(usuario.id).padStart(5,'0')}. {usuario.role==='ADMIN'?'Equipe da biblioteca':'Cartão de leitor'}.</span></div><p className="bc-lanyard-hint text-center text-xs text-muted">{reduced?'Seu cartão da biblioteca.':'Arraste o cartão. Solte para deixá-lo balançar.'}</p></div>;
}
