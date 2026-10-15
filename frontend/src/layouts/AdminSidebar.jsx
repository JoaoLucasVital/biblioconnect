import {useId,useLayoutEffect,useRef,useState} from 'react';
import {Link,NavLink,useLocation} from 'react-router-dom';
import {Activity,ArrowUpRight,BookOpen,ChartNoAxesCombined,ChevronDown,ChevronLeft,Compass,LayoutDashboard,MessageSquare,Plus,ShoppingBag,Star,Truck,Users} from 'lucide-react';
import gsap from 'gsap';
import {ShinyText} from '../components/motion/TextAnimations.jsx';
import useMediaQuery from '../features/home/useMediaQuery.js';
import {adminGroups} from './nav-items.js';

const icons={'/admin':LayoutDashboard,'/admin/livros':BookOpen,'/adicionar-livro':Plus,'/admin/avaliacoes':Star,'/admin/pedidos':ShoppingBag,'/admin/entregas':Truck,'/admin/atrasos':Activity,'/admin/chat':MessageSquare,'/admin/financeiro':ChartNoAxesCombined,'/admin/usuarios':Users};
const groupIcons={Acervo:BookOpen,'Operações':ShoppingBag,'Gestão':ChartNoAxesCombined};

function SidebarLink({item,onNavigate,compact=false}){
  const Icon=icons[item.to]||BookOpen;
  return <NavLink to={item.to} end={item.to==='/admin'} onClick={onNavigate} aria-label={item.label}
    className={({isActive})=>`bc-admin-nav-link${isActive?' is-active':''}`}>
    <Icon size={19} strokeWidth={1.6} aria-hidden="true"/>
    <span className="bc-admin-nav-label"><ShinyText>{item.label}</ShinyText></span>
    {compact&&<span className="bc-admin-tooltip" aria-hidden="true">{item.label}</span>}
  </NavLink>;
}

function SidebarGroup({group,open,compact,current,onToggle,onNavigate}){
  const id=useId(),region=useRef(null),content=useRef(null),previousOpen=useRef(null);
  const reduced=useMediaQuery('(prefers-reduced-motion: reduce)');
  const Icon=groupIcons[group.label]||BookOpen;
  useLayoutEffect(()=>{
    const height=open?content.current.scrollHeight:0;
    if(previousOpen.current===null||reduced){gsap.set(region.current,{height});previousOpen.current=open;return;}
    previousOpen.current=open;
    const tween=gsap.to(region.current,{height,duration:.24,ease:'power3.out',overwrite:true});
    return()=>tween.kill();
  },[open,reduced]);
  return <section className={`bc-admin-nav-group${open?' is-open':''}`}>
    <h2><button type="button" className="bc-admin-group-trigger" data-current={current||undefined} aria-label={group.label} aria-expanded={open} aria-controls={id} onClick={onToggle}>
      <Icon size={19} strokeWidth={1.6} aria-hidden="true"/>
      <span className="bc-admin-nav-label"><ShinyText>{group.label}</ShinyText></span>
      <ChevronDown className="bc-admin-group-chevron" size={15} aria-hidden="true"/>
      {compact&&<span className="bc-admin-tooltip" aria-hidden="true">{group.label}</span>}
    </button></h2>
    <div ref={region} id={id} className="bc-admin-group-region" aria-hidden={!open} inert={!open}>
      <div ref={content} className="bc-admin-group-items">{group.items.map(item=><SidebarLink key={item.to} item={item} onNavigate={onNavigate}/>)}</div>
    </div>
  </section>;
}

export default function AdminSidebar({onNavigate,compact=false,onToggleCompact}){
  const {pathname}=useLocation();
  const groups=adminGroups.filter(group=>group.label!=='Visão geral');
  const activeGroup=groups.find(group=>group.items.some(item=>pathname===item.to))?.label;
  const [selection,setSelection]=useState(null);
  const expanded=selection?.path===pathname?selection.group:activeGroup;
  return <nav aria-label="Administração" className={`bc-admin-nav${compact?' is-compact':''}`}>
    <div className="bc-admin-nav-skin" aria-hidden="true"/>
    <div className="bc-admin-nav-top">
      <span className="bc-admin-nav-emblem" aria-hidden="true"><BookOpen size={21} strokeWidth={1.6}/></span>
      <span className="bc-admin-nav-identity"><ShinyText>Biblioteca</ShinyText><small>ESPAÇO DE GESTÃO</small></span>
      {onToggleCompact&&<button type="button" className="bc-admin-collapse" aria-label={compact?'Expandir menu':'Recolher menu'} aria-expanded={!compact} onClick={onToggleCompact}><ChevronLeft size={17} aria-hidden="true"/></button>}
    </div>
    <p className="bc-admin-nav-caption">SEU ESPAÇO DE TRABALHO</p>
    <div className="bc-admin-nav-body">
      <SidebarLink item={{label:'Painel',to:'/admin'}} compact={compact} onNavigate={onNavigate}/>
      <div className="bc-admin-nav-divider"/>
      {groups.map(group=><SidebarGroup key={group.label} group={group} compact={compact} current={activeGroup===group.label} open={!compact&&expanded===group.label} onNavigate={onNavigate} onToggle={()=>{
        setSelection({path:pathname,group:compact||expanded!==group.label?group.label:null});
        if(compact)onToggleCompact?.();
      }}/>) }
    </div>
    <Link to="/livros" className="bc-admin-atlas-link" onClick={onNavigate} aria-label="Explorar o Atlas"><Compass size={19} strokeWidth={1.6} aria-hidden="true"/><span className="bc-admin-nav-label"><ShinyText>Explorar o Atlas</ShinyText></span><ArrowUpRight className="bc-admin-atlas-arrow" size={15} aria-hidden="true"/>{compact&&<span className="bc-admin-tooltip" aria-hidden="true">Explorar o Atlas</span>}</Link>
  </nav>;
}
