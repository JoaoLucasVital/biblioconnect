import {useId,useRef,useState} from "react";
import {Star} from "lucide-react";
import "../../components/motion/motion.css";
const words=["Ruim","Regular","Bom","Muito bom","Excelente"];
export default function PeekRating({value,onChange,disabled=false,label="Sua avaliação"}){
  const name=useId(),[hover,setHover]=useState(null),inputs=useRef([]);
  function select(index){if(disabled)return;onChange(index+1);inputs.current[index]?.focus();}
  return <fieldset className="bc-peek-rating" disabled={disabled} onPointerLeave={()=>setHover(null)}><legend className="mb-3 text-sm font-medium">{label}</legend><div role="radiogroup" aria-label={label} className="bc-peek-stars" onKeyDown={event=>{
    const index=Number(event.target.value)-1;if(!Number.isInteger(index))return;let next;
    if(event.key==="ArrowRight"||event.key==="ArrowUp")next=(index+1)%5;if(event.key==="ArrowLeft"||event.key==="ArrowDown")next=(index+4)%5;if(event.key==="Home")next=0;if(event.key==="End")next=4;
    if(next!==undefined){event.preventDefault();select(next);}
  }}>{words.map((word,index)=>{const number=index+1,active=number<=(hover??Number(value)),lift=hover===null?0:Math.max(0,1-Math.abs(hover-number)*.35);return <label key={word} className="bc-peek-star" onPointerEnter={event=>{if(event.pointerType==="mouse")setHover(number);}} style={{"--star-lift":lift}}><input ref={node=>{inputs.current[index]=node;}} type="radio" name={name} value={number} checked={Number(value)===number} tabIndex={Number(value)===number?0:-1} onChange={()=>onChange(number)} aria-label={`${number} ${number===1?"estrela":"estrelas"} — ${word}`}/><Star size={30} fill={active?"currentColor":"none"} strokeWidth={1.5} aria-hidden="true"/><span className="sr-only">{word}</span></label>;})}</div><p className="mt-2 text-xs text-muted" aria-live="polite">{value} de 5 · {words[Number(value)-1]}</p></fieldset>;
}
