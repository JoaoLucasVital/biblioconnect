import {useEffect,useRef} from "react";
import {createPortal} from "react-dom";
import useMediaQuery from "../../features/home/useMediaQuery.js";
import "./motion.css";
export default function GlobalClickSpark(){
  const root=useRef(null),reduced=useMediaQuery("(prefers-reduced-motion: reduce)");
  useEffect(()=>{
    const overlay=root.current;if(!overlay||reduced)return;
    const active=new Set(),popover=typeof overlay.showPopover==="function";
    if(popover)overlay.setAttribute("popover","manual");
    function remove(item){item.animation.onfinish=null;item.animation.oncancel=null;item.animation.cancel();item.node.remove();active.delete(item);}
    function spark(event){
      if(event.detail===0||!overlay.animate)return;
      if(popover){try{if(overlay.matches(":popover-open"))overlay.hidePopover();overlay.showPopover();}catch{/* Regular fixed overlay remains available. */}}
      const destination=!popover?[...document.querySelectorAll("dialog[open]")].at(-1)||overlay:overlay;
      while(active.size>24)remove(active.values().next().value);
      for(let i=0;i<8;i++){
        const node=document.createElement("span"),angle=i*Math.PI/4;node.className="bc-click-spark";node.setAttribute("aria-hidden","true");node.style.left=`${event.clientX}px`;node.style.top=`${event.clientY}px`;destination.append(node);
        const animation=node.animate([{opacity:1,transform:`rotate(${angle}rad) translateX(4px) scaleX(1)`},{opacity:0,transform:`rotate(${angle}rad) translateX(30px) scaleX(.2)`}],{duration:320,easing:"cubic-bezier(0.23,1,0.32,1)"});
        const item={node,animation};active.add(item);animation.onfinish=()=>{node.remove();active.delete(item);};animation.oncancel=()=>{node.remove();active.delete(item);};
      }
    }
    document.addEventListener("click",spark,true);
    return()=>{document.removeEventListener("click",spark,true);for(const item of active)remove(item);if(popover&&overlay.matches(":popover-open"))overlay.hidePopover();};
  },[reduced]);
  return createPortal(<div ref={root} className="bc-click-sparks" aria-hidden="true"/>,document.body);
}
