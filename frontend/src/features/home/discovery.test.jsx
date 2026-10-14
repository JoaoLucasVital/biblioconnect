import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import Home from "../../pages/Home.jsx";
import Books from "../../pages/Books.jsx";
import { AuthContext } from "../../context/auth.js";
import { renderWithRouter } from "../../test/renderWithRouter.jsx";
import { livroDisponivel } from "../../test/fixtures.js";
import api from "../../api/api.js";
vi.mock("../../api/api.js",()=>({default:{get:vi.fn()}}));
vi.mock("./useHeroMotion.js",()=>({default:vi.fn()}));
const classic={...livroDisponivel,id:99,titulo:"Clássico preservado",destaque:false};
beforeEach(()=>api.get.mockImplementation(url=>Promise.resolve({data:url==="/livros"?[livroDisponivel,classic]:{}})));
function mount(Component){renderWithRouter(<AuthContext.Provider value={{isAuthenticated:false,isAdmin:false}}><Component/></AuthContext.Provider>);}
it("home abre com a hero de capas destacadas e deixa o Atlas no catálogo",async()=>{
  mount(Home);
  const hero=await screen.findByRole("region",{name:"Histórias em movimento"});
  expect(within(hero).getByRole("heading",{level:1})).toHaveTextContent("Sua próxima obsessão literária");
  expect(within(hero).getByRole("link",{name:"Explorar leituras"})).toHaveAttribute("href","/livros");
  expect(hero.querySelectorAll('[data-book-id="7"]').length).toBeGreaterThan(0);
  expect(hero.querySelector('[data-book-id="99"]')).toBeNull();
  expect(screen.queryByRole("region",{name:"Atlas do Acervo"})).not.toBeInTheDocument();
  fireEvent.click(within(hero).getByRole("button",{name:"Pausar capas"}));
  expect(within(hero).getByRole("button",{name:"Retomar capas"})).toBeVisible();
});
it("catálogo mantém Atlas acima dos livros e preserva os clássicos",async()=>{
  mount(Books);
  const catalog=await screen.findByRole("region",{name:"Catálogo de livros"});
  const atlas=screen.getByRole("region",{name:"Atlas do Acervo"});
  expect(atlas.compareDocumentPosition(catalog)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(catalog).getByRole("heading",{name:classic.titulo})).toBeVisible();
});
it("vitrine distribui gêneros e inclui dark romance mesmo quando foi cadastrado antes",async()=>{
  const romances=Array.from({length:9},(_,index)=>({...livroDisponivel,id:index+1,titulo:`Romance ${index}`}));
  const dark={...livroDisponivel,id:40,titulo:"Dark romance do acervo",categoria:"Dark romance"};
  api.get.mockImplementation(url=>Promise.resolve({data:url==="/livros"?[...romances,dark]:{}}));
  mount(Home);
  const shelf=await screen.findByRole("region",{name:"Só mais um capítulo."});
  expect(within(shelf).getByRole("heading",{name:dark.titulo})).toBeVisible();
});
it("erro de conexão do catálogo não anuncia acervo vazio no Atlas",async()=>{
  api.get.mockRejectedValueOnce(new Error("offline"));mount(Books);
  expect(await screen.findByRole("alert")).toHaveTextContent("Erro ao carregar catálogo");
  expect(screen.queryByText("Nenhum livro disponível ainda")).not.toBeInTheDocument();
});
