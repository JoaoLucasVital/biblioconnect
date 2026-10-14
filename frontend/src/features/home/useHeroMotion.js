import gsap from "gsap";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(useGSAP);
export default function useHeroMotion(ref,{enabled}) {
  useGSAP(()=>{
    if(!enabled)return;
    const motion=gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)",()=>{
      gsap.from("[data-hero-line]",{y:18,opacity:0,duration:0.48,stagger:0.06,ease:"power3.out"});
      gsap.from("[data-hero-detail]",{y:10,opacity:0,duration:0.4,delay:0.12,ease:"power3.out"});
    });
    return ()=>motion.revert();
  },{scope:ref,dependencies:[enabled],revertOnUpdate:true});
}
