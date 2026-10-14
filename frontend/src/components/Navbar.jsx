import { startTransition, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, ArrowUpRight, LogOut } from "lucide-react";
import { useAuth } from "../context/auth.js";
import { publicItems, clientItems } from "../layouts/nav-items.js";
import BrandLogo from "./BrandLogo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import Button from "./ui/Button.jsx";
import Dialog from "./ui/Dialog.jsx";

const navClass = ({isActive}) => `inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-medium ${isActive ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`;
export default function Navbar() {
  const {usuario,isAuthenticated,isAdmin,loadingAuth,logout} = useAuth();
  const navigate = useNavigate();
  const [open,setOpen] = useState(false);
  const items = [...publicItems,...(!loadingAuth && isAuthenticated ? clientItems : []),...(!loadingAuth && isAdmin ? [{label:"Painel",to:"/admin"}] : [])];
  const close = () => setOpen(false);
  const leave = () => startTransition(() => { logout(); close(); navigate("/"); });
  function links(mobile = false) {
    return <><nav aria-label={mobile ? "Navegação móvel" : "Principal"} className={mobile ? "grid gap-2" : "flex items-center gap-6"}>
      {items.map(item=><NavLink key={item.to} end={item.to==="/" || item.to==="/admin"} to={item.to} onClick={close} className={navClass}>{item.label}</NavLink>)}
    </nav>
    {!loadingAuth && (isAuthenticated ? <div className={mobile ? "grid gap-2 border-t border-stroke pt-4" : "flex min-w-0 items-center gap-3"}>
      <span className="max-w-32 truncate text-sm text-muted" title={usuario?.nome}>{usuario?.nome}</span>
      <Button variant="ghost" onClick={leave}><LogOut size={16} aria-hidden="true"/>Sair</Button>
    </div> : <div className="flex items-center gap-5">
      <NavLink to="/login" onClick={close} className={navClass}>Login</NavLink>
      <Link to="/cadastro" onClick={close} className="inline-flex min-h-11 items-center gap-2 rounded border border-stroke px-4 text-sm font-medium hover:border-ink">Criar conta<ArrowUpRight size={16} aria-hidden="true"/></Link>
    </div>)}</>;
  }
  return <header className="relative z-20 border-b border-stroke bg-paper text-ink">
    <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:bg-surface focus:p-3">Pular para conteúdo</a>
    <div className="mx-auto flex min-h-22 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
      <Link to="/" aria-label="BiblioConnect — início" className="flex shrink-0 items-center gap-2">
        <BrandLogo className="h-10 w-10"/>
        <span className="font-display text-[23px] font-semibold tracking-[-0.03em]">BiblioConnect<span className="block font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-muted">Sua próxima leitura</span></span>
      </Link>
      <div className="hidden items-center gap-6 xl:flex">{links()}</div>
      <div className="flex shrink-0 items-center gap-1"><ThemeToggle/>
        <Button variant="ghost" className="px-2 xl:hidden" onClick={()=>setOpen(true)} aria-label="Abrir navegação" aria-expanded={open} aria-controls="menu-principal"><Menu size={22} aria-hidden="true"/></Button>
      </div>
    </div>
    <Dialog open={open} title="Navegação" onClose={close}><div id="menu-principal" className="grid gap-6">{links(true)}</div></Dialog>
  </header>;
}
