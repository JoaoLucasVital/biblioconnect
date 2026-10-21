import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { transitionTheme } from "./motion/themeTransition.js";
import usePageVisible from "./usePageVisible.js";
import "./theme-toggle.css";

function savedTheme() {
  try { return localStorage.getItem("theme")==="dark"; }
  catch { return document.body.classList.contains("dark"); }
}

/** Adapted from RiccardoRapelli / Uiverse; license in THIRD_PARTY_NOTICES.md. */
export default function ThemeToggle() {
  const [dark,setDark]=useState(savedTheme);
  const intended=useRef(dark);
  const visible=usePageVisible();
  useLayoutEffect(()=>{
    document.body.classList.toggle("dark",dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content",dark?"#0f172a":"#fff7ed");
  },[dark]);
  useEffect(()=>{
    const sync=event=>{
      if(event.key!=="theme" && event.key!==null)return;
      const next=savedTheme();intended.current=next;
      transitionTheme(null,()=>setDark(next),{instant:true});
    };
    window.addEventListener("storage",sync);
    return ()=>window.removeEventListener("storage",sync);
  },[]);
  function change(event) {
    const checked=!intended.current;
    intended.current=checked;
    transitionTheme(event.target,()=>{
      flushSync(()=>setDark(checked));
      try { localStorage.setItem("theme",checked?"dark":"light"); } catch { /* Session theme remains usable. */ }
    },{instant:event.nativeEvent.detail===0});
  }
  return <label className="bc-theme-switch" title="Alternar tema" data-paused={!visible || undefined}>
    <input type="checkbox" role="switch" aria-label="Tema escuro" checked={dark} onChange={change}/>
    <span className="bc-theme-slider" aria-hidden="true">
      <span className="bc-theme-orb">
        {[0,1,2].map(i=><svg key={`moon-${i}`} className={`bc-moon-dot bc-moon-dot-${i}`} viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg>)}
        {[0,1,2].map(i=><svg key={`ray-${i}`} className={`bc-light-ray bc-light-ray-${i}`} viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg>)}
        {[0,1,2,3,4,5].map(i=><svg key={`cloud-${i}`} className={`bc-cloud bc-cloud-${i}`} viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg>)}
      </span>
      <span className="bc-theme-stars">{[0,1,2,3].map(i=><svg key={i} className={`bc-star bc-star-${i}`} viewBox="0 0 20 20"><path d="M0 10C10 10 10 10 10 20C10 10 10 10 20 10C10 10 10 10 10 0C10 10 10 10 0 10Z"/></svg>)}</span>
    </span>
  </label>;
}
