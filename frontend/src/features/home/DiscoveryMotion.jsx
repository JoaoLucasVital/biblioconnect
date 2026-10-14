import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useMediaQuery from "./useMediaQuery.js";
gsap.registerPlugin(ScrollTrigger);

// React Bits references, adapted to the existing motion stack and native links.
export function AnimatedContent({children,className=""}) {
  const ref=useRef(null);
  const reduced=useMediaQuery("(prefers-reduced-motion: reduce)");
  useEffect(()=>{
    const el=ref.current;
    if(reduced || !window.IntersectionObserver || !el.animate)return;
    let animation;
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      animation=el.animate([{opacity:0,transform:"translateY(20px)"},{opacity:1,transform:"translateY(0)"}],{duration:480,easing:"cubic-bezier(0.23, 1, 0.32, 1)"});
      observer.disconnect();
    },{threshold:0.08});
    observer.observe(el);
    return ()=>{observer.disconnect();animation?.cancel();};
  },[reduced]);
  return <div ref={ref} className={className}>{children}</div>;
}

export function ScrollExpand({children}) {
  const ref=useRef(null);
  useEffect(()=>{
    if(!window.IntersectionObserver)return;
    const media=gsap.matchMedia();
    media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)",()=>{
      gsap.fromTo(ref.current,{scale:0.88},{scale:1,ease:"none",scrollTrigger:{trigger:ref.current,start:"top 95%",end:"top 30%",scrub:0.4}});
    });
    return ()=>media.revert();
  },[]);
  return <div ref={ref} className="discovery-expand">{children}</div>;
}

export function ClickSpark({children}) {
  const ref=useRef(null);
  const sparks=useRef(new Set());
  const reduced=useMediaQuery("(prefers-reduced-motion: reduce)");
  useEffect(()=>{
    const active=sparks.current;
    return ()=>{active.forEach(({node,animation})=>{animation.cancel();node.remove();});active.clear();};
  },[]);
  function spark(event){
    if(reduced || event.detail===0 || !ref.current?.animate)return;
    const bounds=ref.current.getBoundingClientRect();
    // Bound transient nodes even under repeated clicks; native link activation is untouched.
    sparks.current.forEach(({node,animation})=>{animation.cancel();node.remove();});sparks.current.clear();
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,node=document.createElement("span");
      node.className="discovery-spark";node.setAttribute("aria-hidden","true");
      node.style.left=`${event.clientX-bounds.left}px`;node.style.top=`${event.clientY-bounds.top}px`;
      ref.current.append(node);
      const animation=node.animate([{opacity:1,transform:`rotate(${angle}rad) translateX(5px) scaleX(1)`},{opacity:0,transform:`rotate(${angle}rad) translateX(32px) scaleX(0.2)`}],{duration:320,easing:"cubic-bezier(0.23, 1, 0.32, 1)"});
      const item={node,animation};sparks.current.add(item);
      animation.onfinish=()=>{node.remove();sparks.current.delete(item);};
    }
  }
  return <span ref={ref} className="discovery-spark-target" onClick={spark}>{children}</span>;
}

export function StarBorder({children}) {
  return <div className="discovery-star-border"><span aria-hidden="true" className="discovery-orbit"/>{children}</div>;
}
