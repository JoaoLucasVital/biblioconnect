import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, it, expect, vi } from "vitest";
import {useLocation} from "react-router-dom";
import Books from "../../pages/Books.jsx";
import api from "../../api/api.js";
import { AuthContext } from "../../context/auth.js";
import { renderWithRouter } from "../../test/renderWithRouter.jsx";
import { livroDisponivel, livroDoado, livroSemEstoque } from "../../test/fixtures.js";
vi.mock("../../api/api.js",()=>({default:{get:vi.fn(),post:vi.fn()}}));
beforeEach(()=>{ api.get.mockResolvedValue({data:[livroDisponivel]}); api.post.mockReset(); });
function LocationProbe(){return <output aria-label="Caminho atual">{useLocation().pathname}</output>;}
function mount(authenticated = true) {
  renderWithRouter(<AuthContext.Provider value={{isAuthenticated:authenticated,usuario:{id:1,endereco:"Rua da leitura, 10"}}}><Books/><LocationProbe/></AuthContext.Provider>);
}
it("busca associada e limpar recuperam os livros", async () => {
  mount(); const user=userEvent.setup();
  await within(await screen.findByRole("region",{name:"Catálogo de livros"})).findByRole("heading",{name:livroDisponivel.titulo});
  await user.type(screen.getByLabelText("Buscar no acervo"),"inexistente");
  expect(screen.getByRole("heading",{name:"Nenhum livro encontrado"})).toBeVisible();
  await user.click(screen.getByRole("button",{name:"Limpar filtros"}));
  expect(within(screen.getByRole("region",{name:"Catálogo de livros"})).getByRole("heading",{name:livroDisponivel.titulo})).toBeVisible();
});
it("sem estoque bloqueia operações e não envia POST", async () => {
  api.get.mockResolvedValue({data:[livroSemEstoque]}); mount();
  await within(await screen.findByRole("region",{name:"Catálogo de livros"})).findByRole("heading",{name:livroDisponivel.titulo});
  for(const name of ["Comprar","Alugar","Reservar"]) expect(screen.getByRole("button",{name,exact:true})).toBeDisabled();
  expect(api.post).not.toHaveBeenCalled();
});
it("livro doado mantém reserva bloqueada", async () => {
  api.get.mockResolvedValue({data:[livroDoado]}); mount();
  await within(await screen.findByRole("region",{name:"Catálogo de livros"})).findByRole("heading",{name:livroDisponivel.titulo});
  expect(screen.getByRole("button",{name:"Reservar",exact:true})).toBeDisabled();
});
it("catálogo mostra prévia e encaminha ao checkout sem criar compra",async()=>{
  mount();const user=userEvent.setup();await user.click(await screen.findByRole("button",{name:"Comprar",exact:true}));
  const dialog=screen.getByRole("dialog",{name:"Sua próxima leitura"});
  expect(within(dialog).queryByRole("button",{name:"Calcular frete"})).not.toBeInTheDocument();
  expect(within(dialog).queryByRole("button",{name:"Confirmar compra",exact:true})).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole("button",{name:"Continuar para checkout"}));
  expect(screen.getByLabelText("Caminho atual")).toHaveTextContent("/checkout/7");expect(api.post).not.toHaveBeenCalled();
});
it("aluguel mostra cálculo e preserva dias no erro", async () => {
  api.post.mockRejectedValue({response:{data:{erro:"Aluguel indisponível"}}}); mount(); const user=userEvent.setup();
  await user.click(await screen.findByRole("button",{name:"Alugar",exact:true}));
  const dialog=screen.getByRole("dialog",{name:"Confirmar aluguel"});
  const days=within(dialog).getByLabelText("Quantidade de dias");
  await user.clear(days); await user.type(days,"9");
  expect(within(dialog).getByText(/R\$\s*9,00/)).toBeVisible();
  await user.click(within(dialog).getByRole("button",{name:"Confirmar aluguel"}));
  expect(await within(dialog).findByText("Aluguel indisponível")).toBeVisible();
  expect(within(dialog).getByRole("alert")).toHaveTextContent("Aluguel indisponível");
  expect(days).toHaveValue(9);
  expect(api.post).toHaveBeenCalledExactlyOnceWith("/alugar",{livroId:7,dias:9});
});
it("reserva preserva data e contrato após erro", async () => {
  api.post.mockRejectedValue({response:{data:{erro:"Reserva indisponível"}}}); mount(); const user=userEvent.setup();
  await user.click(await screen.findByRole("button",{name:"Reservar",exact:true}));
  const dialog=screen.getByRole("dialog",{name:"Confirmar reserva"});
  await user.type(within(dialog).getByLabelText("Data de retirada"),"2026-12-01");
  await user.click(within(dialog).getByRole("button",{name:"Confirmar reserva"}));
  expect(await within(dialog).findByText("Reserva indisponível")).toBeVisible();
  expect(within(dialog).getByLabelText("Data de retirada")).toHaveValue("2026-12-01");
  expect(api.post).toHaveBeenCalledExactlyOnceWith("/reservar",{livroId:7,dataRetirada:"2026-12-01"});
});
it("erro de catálogo oferece nova tentativa com a mesma API", async () => {
  api.get.mockRejectedValueOnce(new Error("offline")); mount(); const user=userEvent.setup();
  await user.click(await screen.findByRole("button",{name:"Tentar novamente"}));
  expect(await within(await screen.findByRole("region",{name:"Catálogo de livros"})).findByRole("heading",{name:livroDisponivel.titulo})).toBeVisible();
  expect(api.get.mock.calls.filter(([path])=>path==="/livros")).toHaveLength(2);
});
