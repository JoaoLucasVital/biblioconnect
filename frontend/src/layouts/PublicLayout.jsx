import { Link, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
export default function PublicLayout() {
  return <><Navbar/><div id="conteudo" tabIndex={-1}><Outlet/></div>
    <footer className="mx-auto mt-16 flex max-w-7xl flex-wrap items-center justify-between gap-5 border-t border-stroke px-5 py-8 text-sm text-muted sm:px-8">
      <span className="font-display text-lg text-ink">BiblioConnect</span>
      <span>Uma boa leitura começa com uma escolha.</span>
      <Link to="/livros" className="min-h-11 content-center underline underline-offset-4">Explorar o acervo</Link>
    </footer></>;
}
