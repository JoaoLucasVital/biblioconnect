import {Heart} from "lucide-react";
import "./community.css";
export default function PulseHeart({title,total,saved=false,busy=false,onToggle,error="",unavailable=false}){
  return <div className="bc-save-control"><button type="button" className="bc-pulse-heart" aria-pressed={saved} aria-busy={busy||undefined} disabled={busy||unavailable} aria-label={`${saved?"Remover":"Salvar"} ${title}${saved?" dos salvos":" nos salvos"}. ${total===null?"Contagem indisponível":`${total} ${total===1?"pessoa salvou":"pessoas salvaram"}`}`} onClick={event=>{
    if(event.detail>0&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)event.currentTarget.querySelector("svg")?.animate?.([{transform:"scale(1)"},{transform:"scale(.25)",offset:.35},{transform:"scale(1.15)",offset:.72},{transform:"scale(1)"}],{duration:280,easing:"cubic-bezier(0.23,1,0.32,1)"});
    onToggle();
  }}><Heart size={19} strokeWidth={1.6} fill={saved?"currentColor":"none"} aria-hidden="true"/><span className="tabular-nums">{total===null?"—":total}</span><span className="text-xs">{busy?"Salvando…":saved?"Salvo":"Salvar"}</span></button>{error&&<span className="bc-save-error" aria-live="polite">{error}</span>}</div>;
}
