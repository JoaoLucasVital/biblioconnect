import { useState } from "react";
import { Outlet } from "react-router-dom";
import { PanelLeft } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/ui/Button.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
export default function AdminLayout() {
  const [open,setOpen] = useState(false);
  return <><Navbar/><div className="mx-auto grid max-w-[1600px] lg:grid-cols-[216px_minmax(0,1fr)]">
    <aside className="hidden border-r border-stroke px-4 py-9 lg:block"><div className="sticky top-8"><AdminSidebar/></div></aside>
    <div id="conteudo" tabIndex={-1} className="min-w-0">
      <div className="border-b border-stroke px-5 py-2 lg:hidden"><Button variant="ghost" onClick={()=>setOpen(true)} aria-expanded={open} aria-controls="menu-admin"><PanelLeft size={18} aria-hidden="true"/>Menu administrativo</Button></div>
      <Outlet/>
    </div>
  </div><Dialog open={open} title="Administração" onClose={()=>setOpen(false)}><div id="menu-admin"><AdminSidebar onNavigate={()=>setOpen(false)}/></div></Dialog></>;
}
