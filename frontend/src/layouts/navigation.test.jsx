import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AuthContext } from "../context/auth.js";
import { renderWithRouter } from "../test/renderWithRouter.jsx";
import Navbar from "../components/Navbar.jsx";
import AdminSidebar from "./AdminSidebar.jsx";
import AppRoutes from "../AppRoutes.jsx";
import { routePaths } from "../routes.js";

const visitor = { usuario:null, isAuthenticated:false, isAdmin:false, loadingAuth:false, logout:vi.fn() };
const client = { ...visitor, usuario:{nome:"Leitor",role:"CLIENTE"}, isAuthenticated:true };
function renderAuth(ui, auth = visitor, route = "/") {
  return renderWithRouter(<AuthContext.Provider value={auth}>{ui}</AuthContext.Provider>, {route});
}
describe("navegação por papel", () => {
  it("visitante encontra catálogo e login sem links de gestão", () => {
    renderAuth(<Navbar />);
    expect(screen.getByRole("link", {name:"Catálogo"})).toHaveAttribute("href","/livros");
    expect(screen.getByRole("link", {name:"Login"})).toHaveAttribute("href","/login");
    expect(screen.queryByRole("link", {name:"Financeiro"})).not.toBeInTheDocument();
  });
  it("cliente encontra pedidos e atendimento", () => {
    renderAuth(<Navbar />,client);
    expect(screen.getByRole("link", {name:"Meus pedidos"})).toHaveAttribute("href","/meus-pedidos");
    expect(screen.getByRole("link", {name:"Atendimento"})).toHaveAttribute("href","/chat");
  });
  it("cancelar o menu móvel atualiza o estado e devolve foco", async () => {
    const user = userEvent.setup();
    renderAuth(<Navbar />);
    const trigger = screen.getByRole("button", {name:"Abrir navegação"});
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded","true");
    fireEvent(screen.getByRole("dialog"), new Event("cancel", {cancelable:true}));
    expect(trigger).toHaveAttribute("aria-expanded","false");
    expect(trigger).toHaveFocus();
  });
  it("sidebar conserva todos os destinos administrativos", () => {
    renderAuth(<AdminSidebar />, {...client,isAdmin:true});
    expect(screen.getByRole("navigation", {name:"Administração"})).toBeVisible();
    for (const name of ["Visão geral","Acervo","Operações","Gestão"]) expect(screen.getByText(name)).toBeVisible();
    for (const dest of ["/admin","/admin/livros","/adicionar-livro","/admin/pedidos","/admin/entregas","/admin/atrasos","/admin/financeiro","/admin/usuarios","/admin/avaliacoes","/admin/chat"]) {
      expect(screen.getAllByRole("link").some(link=>link.getAttribute("href")===dest)).toBe(true);
    }
  });
  it("cliente não abre conteúdo administrativo por URL direta", async () => {
    renderAuth(<AppRoutes />,client,"/admin");
    expect(await screen.findByRole("heading", {name:"Acesso negado"})).toBeVisible();
    expect(screen.queryByRole("navigation", {name:"Administração"})).not.toBeInTheDocument();
  });
  it("carregamento de autenticação não expõe o layout protegido", () => {
    renderAuth(<AppRoutes />, {...client,loadingAuth:true,isAdmin:true},"/admin");
    expect(screen.getByText("Verificando autenticação...")).toBeVisible();
    expect(screen.queryByRole("navigation", {name:"Administração"})).not.toBeInTheDocument();
  });
  it("preserva a matriz de URLs e parâmetros", () => {
    expect(routePaths).toEqual(expect.arrayContaining(["/","/livros","/login","/cadastro","/esqueci-senha","/redefinir-senha/:token","/livros/:id/avaliacoes","/chat","/meus-pedidos","/pedido-confirmado/:id","/comprovante/:id","/admin","/admin/livros","/admin/pedidos","/admin/financeiro","/admin/usuarios","/admin/atrasos","/admin/avaliacoes","/admin/chat","/admin/entregas","/adicionar-livro","/editar-livro/:id","*"]));
    expect(routePaths).toHaveLength(23);
  });
});
