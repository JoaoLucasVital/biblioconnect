import {useEffect,useId,useLayoutEffect,useRef,useState} from "react";
import Button from "./Button.jsx";
import "../motion/motion.css";
export default function HoldButton({onConfirm,disabled=false,busy=false,children,holdDurationMs=1200}){
  const [phase,setPhase]=useState("idle"),[alternative,setAlternative]=useState(false),hint=useId();
  const timer=useRef(null),resetTimer=useRef(null),mounted=useRef(true),locked=useRef(false),current=useRef({disabled,busy,onConfirm});
  useLayoutEffect(()=>{
    current.current={disabled,busy,onConfirm};
    if((disabled||busy)&&timer.current!==null){clearTimeout(timer.current);timer.current=null;queueMicrotask(()=>{if(mounted.current&&!locked.current)setPhase("idle");});}
  },[disabled,busy,onConfirm]);
  useEffect(()=>{
    mounted.current=true;
    const interrupt=()=>{clearTimeout(timer.current);timer.current=null;if(!locked.current)setPhase("idle");};
    const visibility=()=>{if(document.hidden)interrupt();};
    window.addEventListener("blur",interrupt);document.addEventListener("visibilitychange",visibility);
    return()=>{mounted.current=false;clearTimeout(timer.current);clearTimeout(resetTimer.current);window.removeEventListener("blur",interrupt);document.removeEventListener("visibilitychange",visibility);};
  },[]);
  function cancel(){clearTimeout(timer.current);timer.current=null;if(!locked.current)setPhase("idle");}
  function confirm(){
    clearTimeout(timer.current);timer.current=null;if(locked.current||current.current.disabled||current.current.busy)return;
    locked.current=true;setPhase("done");
    let result;try{result=current.current.onConfirm();}catch(error){result=Promise.reject(error);}
    Promise.resolve(result).catch(()=>{}).finally(()=>{
      if(mounted.current)resetTimer.current=setTimeout(()=>{if(mounted.current){locked.current=false;setPhase("idle");setAlternative(false);}},180);
    });
  }
  function start(){if(current.current.disabled||current.current.busy||locked.current||timer.current!==null)return;setPhase("holding");timer.current=setTimeout(confirm,holdDurationMs);}
  return <div className="bc-hold-control">
    <button type="button" className="bc-hold-button" data-state={phase} disabled={disabled||busy||phase==="done"} aria-busy={busy||phase==="holding"||undefined} aria-label={typeof children==="string"?children:"Confirmar"} aria-describedby={hint} style={{"--hold-duration":`${holdDurationMs}ms`}}
      onPointerDown={event=>{if(event.button!==undefined&&event.button!==0)return;event.currentTarget.setPointerCapture?.(event.pointerId);start();}}
      onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel} onBlur={cancel}
      onKeyDown={event=>{if(![" ","Enter"].includes(event.key))return;event.preventDefault();if(!event.repeat)start();}}
      onKeyUp={event=>{if([" ","Enter"].includes(event.key)){event.preventDefault();cancel();}}}>
      <span className="bc-hold-fill" aria-hidden="true"/><span className="relative">{phase==="done"?"Confirmado · continuando…":busy?"Continuando…":children}</span>
    </button>
    <span id={hint} className="text-center text-[11px] leading-relaxed text-muted">Segure por {(holdDurationMs/1000).toLocaleString("pt-BR")} s para continuar ao pagamento.</span>
    <button type="button" disabled={disabled||busy||phase==="done"} className="min-h-8 text-center text-xs text-muted underline underline-offset-4 disabled:opacity-50" onClick={()=>{cancel();setAlternative(value=>!value);}}>Confirmar sem segurar</button>
    {alternative&&<div role="group" aria-label="Confirmação alternativa" className="grid gap-3 rounded border border-stroke bg-soft p-4"><p className="text-sm">Confirmar a compra e continuar para o pagamento?</p><Button disabled={disabled||busy||phase==="done"} onClick={confirm}>Sim, continuar</Button><Button variant="ghost" disabled={busy} onClick={()=>setAlternative(false)}>Voltar</Button></div>}
  </div>;
}
