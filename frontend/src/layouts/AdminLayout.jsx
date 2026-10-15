import { useLayoutEffect,useRef,useState } from "react";
import { Outlet } from "react-router-dom";
import { PanelLeft } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/ui/Button.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import gsap from "gsap";
import "./admin-workspace.css";
export default function AdminLayout() {
  const [open,setOpen] = useState(false);
  const [compact,setCompact]=useState(false);
  const rail=useRef(null),content=useRef(null),previous=useRef(null);
  useLayoutEffect(()=>{
    const skin=rail.current.querySelector('.bc-admin-nav-skin');
    const next={width:skin.getBoundingClientRect().width,left:content.current.getBoundingClientRect().left};
    const before=previous.current;previous.current=null;
    if(!before||window.matchMedia('(prefers-reduced-motion: reduce)').matches||!window.matchMedia('(min-width:1024px)').matches)return;
    const context=gsap.context(()=>{
      gsap.fromTo(skin,{scaleX:before.width/next.width},{scaleX:1,duration:.5,ease:'elastic.out(1,.6)',transformOrigin:'left center',clearProps:'transform'});
      gsap.fromTo(content.current,{x:before.left-next.left},{x:0,duration:.5,ease:'elastic.out(1,.6)',clearProps:'transform'});
      if(!compact)gsap.fromTo(rail.current.querySelectorAll('.bc-admin-nav-label,.bc-admin-nav-identity'),{opacity:0,x:-6},{opacity:1,x:0,duration:.18,ease:'power3.out',clearProps:'opacity,transform'});
    });
    return()=>context.revert();
  },[compact]);
  const toggleCompact=()=>{
    const skin=rail.current.querySelector('.bc-admin-nav-skin');
    previous.current={width:skin.getBoundingClientRect().width,left:content.current.getBoundingClientRect().left};
    setCompact(value=>!value);
  };
  return <><Navbar/><div className={`bc-admin-workspace mx-auto grid max-w-[1600px]${compact?' is-compact':''}`}>
    <aside ref={rail} className="bc-admin-rail hidden lg:block"><div className="sticky top-5"><AdminSidebar compact={compact} onToggleCompact={toggleCompact}/></div></aside>
    <div ref={content} id="conteudo" tabIndex={-1} className="bc-admin-content min-w-0">
      <div className="border-b border-stroke px-5 py-2 lg:hidden"><Button variant="ghost" onClick={()=>setOpen(true)} aria-expanded={open} aria-controls="menu-admin"><PanelLeft size={18} aria-hidden="true"/>Menu administrativo</Button></div>
      <Outlet/>
    </div>
  </div><Dialog open={open} title="Administração" onClose={()=>setOpen(false)}><div id="menu-admin"><AdminSidebar onNavigate={()=>setOpen(false)}/></div></Dialog></>;
}
