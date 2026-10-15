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
  it("admin abre os pedidos dos clientes no cabeçalho e no menu compacto", async () => {
    renderAuth(<Navbar />, {...client,isAdmin:true,usuario:{nome:"Admin",role:"ADMIN"}});
    expect(screen.getByRole("link",{name:"Pedidos",exact:true})).toHaveAttribute("href","/admin/pedidos");
    expect(screen.queryByRole("link",{name:"Meus pedidos",exact:true})).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button",{name:"Abrir navegação"}));
    expect(screen.getAllByRole("link",{name:"Pedidos",exact:true})).toHaveLength(2);
    for(const link of screen.getAllByRole("link",{name:"Pedidos",exact:true})) expect(link).toHaveAttribute("href","/admin/pedidos");
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
  it("sidebar agrupa os destinos administrativos sem uma lista extensa", async () => {
    const user=userEvent.setup();
    renderAuth(<AdminSidebar />, {...client,isAdmin:true});
    expect(screen.getByRole("navigation", {name:"Administração"})).toBeVisible();
    expect(screen.getByRole("link",{name:"Painel",exact:true})).toHaveAttribute("href","/admin");
    expect(screen.queryByRole("link",{name:"Livros",exact:true})).not.toBeInTheDocument();
    for (const [name,destinations] of [["Acervo",["/admin/livros","/adicionar-livro","/admin/avaliacoes"]],["Operações",["/admin/pedidos","/admin/entregas","/admin/atrasos","/admin/chat"]],["Gestão",["/admin/financeiro","/admin/usuarios"]]]) {
      const trigger=screen.getByRole("button",{name,exact:true});await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded","true");
      for(const dest of destinations)expect(screen.getAllByRole("link").some(link=>link.getAttribute("href")===dest)).toBe(true);
    }
    expect(screen.getByRole("button",{name:"Acervo",exact:true})).toHaveAttribute("aria-expanded","false");
    expect(screen.queryByRole("link",{name:"Pedidos",exact:true})).not.toBeInTheDocument();
  });
  it("abre o grupo da rota atual e acompanha navegação entre destinos", async () => {
    const user=userEvent.setup();
    renderAuth(<AdminSidebar/>, {...client,isAdmin:true},"/admin/financeiro");
    expect(screen.getByRole("button",{name:"Gestão",exact:true})).toHaveAttribute("aria-expanded","true");
    expect(screen.getByRole("link",{name:"Financeiro",exact:true})).toHaveAttribute("aria-current","page");
    await user.click(screen.getByRole("button",{name:"Acervo",exact:true}));
    await user.click(screen.getByRole("link",{name:"Livros",exact:true}));
    expect(screen.getByRole("button",{name:"Acervo",exact:true})).toHaveAttribute("aria-expanded","true");
    expect(screen.getByRole("link",{name:"Livros",exact:true})).toHaveAttribute("aria-current","page");
  });
  it("modo compacto conserva nomes acessíveis e expande o grupo selecionado", async () => {
    const user=userEvent.setup(),expand=vi.fn();
    renderAuth(<AdminSidebar compact onToggleCompact={expand}/>,{...client,isAdmin:true},"/admin/financeiro");
    await user.click(screen.getByRole("button",{name:"Expandir menu",exact:true}));
    expect(expand).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button",{name:"Gestão",exact:true}));
    expect(expand).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("link",{name:"Financeiro",exact:true})).not.toBeInTheDocument();
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
    expect(routePaths).toContain("/perfil");
    expect(routePaths).toContain("/checkout/:livroId");
    expect(routePaths).toHaveLength(25);
  });
});
