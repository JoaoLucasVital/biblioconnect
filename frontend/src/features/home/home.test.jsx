import { render, screen, fireEvent, act } from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import Home from "../../pages/Home.jsx";
import EditorialHero from "./EditorialHero.jsx";
import SceneBoundary from "./SceneBoundary.jsx";
import { AuthContext } from "../../context/auth.js";
import { renderWithRouter } from "../../test/renderWithRouter.jsx";
import { livroDisponivel } from "../../test/fixtures.js";
import api from "../../api/api.js";
vi.mock("../../api/api.js",()=>({default:{get:vi.fn()}}));
vi.mock("./useHeroMotion.js",()=>({default:vi.fn()}));
const second={...livroDisponivel,id:8,titulo:"Outra leitura real",imagemUrl:null};
function media(reduced=false) {
  vi.spyOn(window,"matchMedia").mockImplementation(query=>({matches:query.includes("reduce") && reduced,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
}
beforeEach(()=>{media();vi.spyOn(document,"hidden","get").mockReturnValue(false);});
afterEach(()=>vi.useRealTimers());
function home(auth={isAuthenticated:false,isAdmin:false}) {
  renderWithRouter(<AuthContext.Provider value={auth}><Home/></AuthContext.Provider>);
}
function hero(onSelect=vi.fn()) {
  renderWithRouter(<EditorialHero livro={livroDisponivel} destaques={[livroDisponivel,second]} selectedIndex={0} onSelect={onSelect} accountAction={{label:"Criar conta",to:"/cadastro"}}/>);
  return onSelect;
}
it("home usa acervo e rankings retornados pela API", async()=>{
  api.get.mockImplementation(url=>Promise.resolve({data:url==="/livros"?[livroDisponivel]:{livrosMaisVendidos:[{...second,quantidadeVendas:3}],generosMaisVendidos:[{genero:"Romance",quantidadeVendas:3}]}}));
  home(); expect((await screen.findAllByText(livroDisponivel.titulo)).length).toBeGreaterThan(0);
  expect(screen.getByText("Outra leitura real")).toBeVisible();
  expect(screen.getAllByText("3 vendas").length).toBeGreaterThan(0);
  expect(api.get).toHaveBeenCalledWith("/public/home-insights");
});
it.each([
  [{isAuthenticated:false,isAdmin:false},"Criar conta","/cadastro"],
  [{isAuthenticated:true,isAdmin:false,usuario:{nome:"Leitor"}},"Meus pedidos","/meus-pedidos"],
  [{isAuthenticated:true,isAdmin:true},"Painel administrativo","/admin"],
])("CTA conserva o destino do papel atual",async(auth,label,to)=>{
  api.get.mockResolvedValue({data:[]});home(auth);
  expect(await screen.findByRole("link",{name:label,exact:true})).toHaveAttribute("href",to);
});
it("acervo vazio não inventa livros ou vendas",async()=>{
  api.get.mockImplementation(url=>Promise.resolve({data:url==="/livros"?[]:{livrosMaisVendidos:[],generosMaisVendidos:[]}}));
  home();
  expect(await screen.findByText("Nenhum livro disponível ainda")).toBeVisible();
  expect(screen.getByText("Sem vendas registradas")).toBeVisible();
  expect(screen.queryByText(livroDisponivel.titulo)).not.toBeInTheDocument();
});
it("destaque troca em 6000ms e limpa o timer ao desmontar",()=>{
  vi.useFakeTimers();
  const onSelect=vi.fn();const {unmount}=renderWithRouter(<EditorialHero livro={livroDisponivel} destaques={[livroDisponivel,second]} selectedIndex={0} onSelect={onSelect} accountAction={{label:"Criar conta",to:"/cadastro"}}/>);
  act(()=>vi.advanceTimersByTime(5999));expect(onSelect).not.toHaveBeenCalled();
  act(()=>vi.advanceTimersByTime(1));expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);
  unmount();act(()=>vi.advanceTimersByTime(12000));expect(onSelect).toHaveBeenCalledTimes(1);
});
it("foco e mouse no hero conservam o avanço automático sem botão de pausa",()=>{
  vi.useFakeTimers();const change=hero();
  act(()=>screen.getByRole("link",{name:/Ver catálogo/}).focus());
  fireEvent.pointerEnter(screen.getByRole("region",{name:"Descubra sua próxima leitura"}),{pointerType:"mouse"});
  act(()=>vi.advanceTimersByTime(6000));expect(change).toHaveBeenCalledExactlyOnceWith(1);
  expect(screen.queryByRole("button",{name:/Pausar|Retomar/})).not.toBeInTheDocument();
});
it("interação manual conserva o avanço automático",()=>{
  vi.useFakeTimers();const change=hero();
  fireEvent.click(screen.getByRole("button",{name:"Próximo destaque"}));
  expect(change).toHaveBeenCalledExactlyOnceWith(1);
  change.mockClear();act(()=>vi.advanceTimersByTime(6000));expect(change).toHaveBeenCalledExactlyOnceWith(1);
});
it("aba oculta pausa o destaque",()=>{
  vi.useFakeTimers();const change=hero();
  vi.spyOn(document,"hidden","get").mockReturnValue(true);
  fireEvent(document,new Event("visibilitychange"));
  act(()=>vi.advanceTimersByTime(6000));expect(change).not.toHaveBeenCalled();
});
it("movimento reduzido conserva capa e impede avanço automático",()=>{
  media(true);vi.useFakeTimers();const change=hero();
  act(()=>vi.advanceTimersByTime(12000));expect(change).not.toHaveBeenCalled();
  expect(screen.getByRole("link",{name:/Ver catálogo/})).toHaveAttribute("href","/livros");
  expect(screen.getByRole("img",{name:`Capa de ${livroDisponivel.titulo}`})).toBeVisible();
});
it("sem WebGL o caminho para o catálogo permanece disponível",()=>{
  vi.spyOn(console,"error").mockImplementation(()=>{});
  function FailedScene(){throw new Error("WebGL indisponível");}
  render(<SceneBoundary fallback={<a href="/livros">Ver catálogo</a>}><FailedScene/></SceneBoundary>);
  expect(screen.getByRole("link",{name:"Ver catálogo"})).toHaveAttribute("href","/livros");
});
