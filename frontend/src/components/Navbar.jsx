import { startTransition, useCallback, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, ArrowUpRight, LogOut } from "lucide-react";
import { useAuth } from "../context/auth.js";
import { publicItems, clientItems } from "../layouts/nav-items.js";
import BrandLogo from "./BrandLogo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import Button from "./ui/Button.jsx";
import CardNav from "./CardNav.jsx";
import {ShinyText} from './motion/TextAnimations.jsx';

const navClass = ({isActive}) => `inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-medium ${isActive ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`;
export default function Navbar() {
  const {usuario,isAuthenticated,isAdmin,loadingAuth,logout} = useAuth();
  const navigate = useNavigate();
  const [open,setOpen] = useState(false);
  const [logoutError,setLogoutError] = useState("");
  const [menuMotion,setMenuMotion] = useState("instant");
  const accountItems = clientItems.map(item => isAdmin && item.to === "/meus-pedidos" ? {label:"Pedidos",to:"/admin/pedidos"} : item);
  const items = [...publicItems,...(!loadingAuth && isAuthenticated ? accountItems : []),...(!loadingAuth && isAdmin ? [{label:"Painel",to:"/admin"}] : [])];
  const close = useCallback(() => setOpen(false), []);
  const leave = async () => {
    setLogoutError("");
    try { await logout(); startTransition(() => { close(); navigate("/"); }); }
    catch { setLogoutError("Não foi possível encerrar a sessão. Tente novamente."); }
  };
  const groups = [{title:"Descubra", eyebrow:"Explore", tone:"cream", links:publicItems}];
  if (!loadingAuth) {
    if (isAuthenticated) groups.push(
      {title:"Sua biblioteca", eyebrow:"Leituras", tone:"navy", links:[...accountItems,...(isAdmin ? [{label:"Painel",to:"/admin"}] : [])]},
      {title:"Sua conta", eyebrow:"Perfil", tone:"orange", description:usuario?.nome, action:<button type="button" onClick={leave} className="bc-nav-card-link"><LogOut size={19} aria-hidden="true"/><span>Sair</span></button>},
    );
    else groups.push(
      {title:"Já tem conta?", eyebrow:"Bem-vindo de volta", tone:"navy", description:"Suas leituras esperam por você.", links:[{label:"Login",to:"/login"}]},
      {title:"Comece a ler", eyebrow:"Faça parte", tone:"orange", description:"Um novo capítulo começa com uma conta.", links:[{label:"Criar conta",to:"/cadastro"}]},
    );
  }
  function links() {
    return <><nav aria-label="Principal" className="flex items-center gap-6">
      {items.map(item=><NavLink key={item.to} end={item.to==="/" || item.to==="/admin"} to={item.to} onClick={close} className={navClass}>{item.label}</NavLink>)}
    </nav>
    {!loadingAuth && (isAuthenticated ? <div className="flex min-w-0 items-center gap-3">
      <span className="max-w-32 truncate text-sm text-muted" title={usuario?.nome}>{usuario?.nome}</span>
      <Button variant="ghost" onClick={leave}><LogOut size={16} aria-hidden="true"/>Sair</Button>
    </div> : <div className="flex items-center gap-5">
      <NavLink to="/login" onClick={close} className={navClass}>Login</NavLink>
      <Link to="/cadastro" onClick={close} className="inline-flex min-h-11 items-center gap-2 rounded border border-stroke px-4 text-sm font-medium hover:border-ink">Criar conta<ArrowUpRight size={16} aria-hidden="true"/></Link>
    </div>)}</>;
  }
  return <header className="relative z-20 border-b border-stroke bg-paper text-ink">
    <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-surface focus:p-3">Pular para conteúdo</a>
    <div className="mx-auto flex min-h-22 max-w-7xl items-center justify-between gap-2 px-5 sm:gap-5 sm:px-8">
      <Link to="/" aria-label="BiblioConnect — início" className="flex min-h-11 shrink-0 items-center gap-2 sm:gap-2.5">
        <BrandLogo className="h-6 w-9 sm:h-8 sm:w-12"/>
        <span className="font-sans text-[18px] font-semibold leading-tight tracking-[-0.055em] sm:text-[22px]"><ShinyText>BiblioConnect</ShinyText><span className="mt-1 block text-[8px] font-medium uppercase tracking-[0.13em] text-muted sm:text-[9px] sm:tracking-[0.17em]">Sua próxima leitura</span></span>
      </Link>
      <div className="hidden items-center gap-6 xl:flex">{links()}</div>
      <div className="flex shrink-0 items-center gap-1"><ThemeToggle/>
        <Button variant="ghost" className="px-2 xl:hidden" onClick={event=>{setMenuMotion(event.detail > 0 ? "pointer" : "instant");setOpen(true);}} aria-label="Abrir navegação" aria-haspopup="dialog" aria-expanded={open} aria-controls="menu-principal"><Menu size={22} aria-hidden="true"/></Button>
      </div>
    </div>
    <CardNav open={open} motion={menuMotion} groups={groups} onClose={close}/>
    {logoutError && <p role="alert" className="mx-auto max-w-7xl px-5 pb-3 text-sm text-danger">{logoutError}</p>}
  </header>;
}
