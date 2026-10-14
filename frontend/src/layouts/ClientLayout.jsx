import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
export default function ClientLayout() {
  return <><Navbar/><div id="conteudo" tabIndex={-1} className="min-h-[calc(100dvh-88px)]"><Outlet/></div></>;
}
