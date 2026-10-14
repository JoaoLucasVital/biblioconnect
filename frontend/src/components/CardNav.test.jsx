import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/auth.js";
import { renderWithRouter } from "../test/renderWithRouter.jsx";
import Navbar from "./Navbar.jsx";

const visitor = { usuario:null, isAuthenticated:false, isAdmin:false, loadingAuth:false, logout:vi.fn() };
const client = { ...visitor, usuario:{nome:"Leitora"}, isAuthenticated:true };
function Location() { return <output aria-label="Destino">{useLocation().pathname}</output>; }
function renderNav(auth = visitor, route = "/") {
  return renderWithRouter(<AuthContext.Provider value={auth}><Navbar/><Location/></AuthContext.Provider>, {route});
}
async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", {name:"Abrir navegação"}));
  return {user, menu:screen.getByRole("dialog", {name:"Navegação"})};
}

describe("Card Nav compacto", () => {
  it("agrupa os destinos do visitante em cartões identificados e fecha ao navegar", async () => {
    renderNav();
    const {user, menu} = await openMenu();
    const explore = within(menu).getByRole("region", {name:"Descubra"});
    expect(within(explore).getByRole("link", {name:"Início"})).toHaveAttribute("href","/");
    expect(within(explore).getByRole("link", {name:"Catálogo"})).toHaveAttribute("href","/livros");
    expect(within(menu).getByRole("region", {name:"Já tem conta?"})).toBeVisible();
    const register = within(menu).getByRole("region", {name:"Comece a ler"});
    await user.click(within(register).getByRole("link", {name:"Criar conta"}));
    expect(screen.getByLabelText("Destino")).toHaveTextContent("/cadastro");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", {name:"Abrir navegação"})).toHaveAttribute("aria-expanded","false");
  });

  it("preserva os destinos de cliente e administrador e encerra a sessão", async () => {
    const logout = vi.fn();
    renderNav({...client, isAdmin:true, logout}, "/meus-pedidos");
    const {user, menu} = await openMenu();
    const library = within(menu).getByRole("region", {name:"Sua biblioteca"});
    for (const [name, path] of [["Meus pedidos","/meus-pedidos"],["Atendimento","/chat"],["Painel","/admin"]]) {
      expect(within(library).getByRole("link", {name})).toHaveAttribute("href",path);
    }
    const account = within(menu).getByRole("region", {name:"Sua conta"});
    expect(within(account).getByText("Leitora")).toBeVisible();
    await user.click(within(account).getByRole("button", {name:"Sair"}));
    expect(logout).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Destino")).toHaveTextContent("/");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("não mostra ações de sessão enquanto a autenticação carrega", async () => {
    renderNav({...client, isAdmin:true, loadingAuth:true});
    const {menu} = await openMenu();
    expect(within(menu).getByRole("link", {name:"Catálogo"})).toBeVisible();
    for (const name of ["Login","Criar conta","Meus pedidos","Atendimento","Painel"]) {
      expect(within(menu).queryByRole("link", {name})).not.toBeInTheDocument();
    }
    expect(within(menu).queryByRole("button", {name:"Sair"})).not.toBeInTheDocument();
  });

  it("abre com teclado e fecha pelo botão devolvendo o foco", async () => {
    const user = userEvent.setup();
    renderNav();
    const trigger = screen.getByRole("button", {name:"Abrir navegação"});
    trigger.focus();
    await user.keyboard("{Enter}");
    const menu = screen.getByRole("dialog", {name:"Navegação"});
    await user.click(within(menu).getByRole("button", {name:"Fechar navegação"}));
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded","false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("restaura a rolagem e o foco ao cancelar o menu", async () => {
    renderNav();
    const {menu} = await openMenu();
    expect(document.documentElement.style.overflow).toBe("hidden");
    fireEvent(menu, new Event("cancel", {cancelable:true}));
    expect(document.documentElement.style.overflow).not.toBe("hidden");
    expect(screen.getByRole("button", {name:"Abrir navegação"})).toHaveFocus();
  });

  it("fecha ao trocar para a navegação de desktop e libera a página", async () => {
    const desktop = Object.assign(new EventTarget(), {matches:false});
    const matchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => query === "(min-width: 80rem)" ? desktop : matchMedia(query));
    renderNav();
    await openMenu();
    act(() => desktop.dispatchEvent(Object.assign(new Event("change"), {matches:true})));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.documentElement.style.overflow).not.toBe("hidden");
    expect(screen.getByRole("button", {name:"Abrir navegação"})).toHaveAttribute("aria-expanded","false");
  });

  it.each([
    ["ponteiro", false, true],
    ["teclado", false, false],
    ["ponteiro com movimento reduzido", true, false],
  ])("respeita a entrada por %s", async (input, reduceMotion, shouldAnimate) => {
    const originalAnimate = Element.prototype.animate;
    const animate = vi.fn(() => ({cancel:vi.fn()}));
    Object.defineProperty(Element.prototype, "animate", {configurable:true, writable:true, value:animate});
    const matchMedia = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({...matchMedia(query), matches:query === "(prefers-reduced-motion: reduce)" && reduceMotion}));
    try {
      const user = userEvent.setup();
      renderNav();
      const trigger = screen.getByRole("button", {name:"Abrir navegação"});
      if (input === "teclado") { trigger.focus(); await user.keyboard("{Enter}"); }
      else await user.click(trigger);
      expect(screen.getByRole("dialog", {name:"Navegação"})).toBeVisible();
      if (shouldAnimate) expect(animate).toHaveBeenCalled();
      else expect(animate).not.toHaveBeenCalled();
      fireEvent(screen.getByRole("dialog"), new Event("cancel", {cancelable:true}));
      expect(trigger).toHaveFocus();
    } finally {
      if (originalAnimate) Element.prototype.animate = originalAnimate;
      else delete Element.prototype.animate;
    }
  });
});
