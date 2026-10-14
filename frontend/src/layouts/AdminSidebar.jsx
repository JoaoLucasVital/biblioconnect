import { NavLink } from "react-router-dom";
import { adminGroups } from "./nav-items.js";
export default function AdminSidebar({onNavigate}) {
  return <nav aria-label="Administração" className="grid gap-7">
    {adminGroups.map(group=><section key={group.label}>
      <h2 className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{group.label}</h2>
      <div className="grid gap-1">{group.items.map(item=><NavLink key={item.to} to={item.to} end={item.to==="/admin"} onClick={onNavigate}
        className={({isActive})=>`flex min-h-11 items-center rounded px-3 text-sm ${isActive ? "bg-soft font-semibold text-ink" : "text-muted hover:bg-soft hover:text-ink"}`}>{item.label}</NavLink>)}</div>
    </section>)}
  </nav>;
}
