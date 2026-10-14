import { Link,NavLink } from "react-router-dom";
import { Activity,ArrowUpRight,BookOpen,ChartNoAxesCombined,LayoutDashboard,MessageSquare,Plus,ShoppingBag,Star,Truck,Users } from "lucide-react";
import { adminGroups } from "./nav-items.js";
const icons={"/admin":LayoutDashboard,"/admin/livros":BookOpen,"/adicionar-livro":Plus,"/admin/avaliacoes":Star,"/admin/pedidos":ShoppingBag,"/admin/entregas":Truck,"/admin/atrasos":Activity,"/admin/chat":MessageSquare,"/admin/financeiro":ChartNoAxesCombined,"/admin/usuarios":Users};
export default function AdminSidebar({onNavigate}) {
  return <nav aria-label="Administração" className="bc-admin-nav grid gap-7">
    <p className="bc-admin-nav-caption">BIBLIOTECA / GESTÃO</p>
    {adminGroups.map(group=><section key={group.label}>
      <h2 className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{group.label}</h2>
      <div className="grid gap-1">{group.items.map(item=>{const Icon=icons[item.to]||BookOpen;return <NavLink key={item.to} to={item.to} end={item.to==="/admin"} onClick={onNavigate}
        className={({isActive})=>`bc-admin-nav-link ${isActive?"is-active":""}`}><Icon size={17} strokeWidth={1.5} aria-hidden="true"/>{item.label}</NavLink>;})}</div>
    </section>)}
    <Link to="/livros" className="bc-admin-atlas-link" onClick={onNavigate}>Explorar o Atlas<ArrowUpRight size={16} aria-hidden="true"/></Link>
  </nav>;
}
