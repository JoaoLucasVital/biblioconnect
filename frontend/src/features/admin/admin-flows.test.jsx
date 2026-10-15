import {screen,within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach,it,expect,vi} from "vitest";
import {Routes,Route} from "react-router-dom";
import AdminOrders from "../../pages/AdminOrders.jsx";
import AdminReviews from "../../pages/AdminReviews.jsx";
import AdminUsers from "../../pages/AdminUsers.jsx";
import EditBook from "../../pages/EditBook.jsx";
import {renderWithRouter} from "../../test/renderWithRouter.jsx";
import {livroDisponivel} from "../../test/fixtures.js";
import api from "../../api/api.js";
vi.mock("../../api/api.js",()=>({default:{get:vi.fn(),post:vi.fn(),put:vi.fn(),patch:vi.fn(),delete:vi.fn()}}));
beforeEach(()=>{api.get.mockReset();api.patch.mockReset();api.put.mockReset();});
it("filtros mantêm os valores concretos de status dos pedidos",async()=>{
  api.get.mockResolvedValue({data:[]});renderWithRouter(<AdminOrders/>);
  const select=await screen.findByLabelText("Status");
  expect([...select.options].map(option=>option.value)).toEqual(["todos","pendente","concluido","devolvido","cancelado"]);
});
it("moderação mantém pendente, aprovado e oculto",async()=>{
  api.get.mockResolvedValue({data:[]});renderWithRouter(<AdminReviews/>);
  const filters=within(screen.getByRole('navigation',{name:'Status das avaliações'}));
  for(const label of ['Todas','Pendentes','Aprovadas','Ocultas'])expect(filters.getByRole('button',{name:new RegExp(label)})).toBeVisible();
  await userEvent.click(filters.getByRole('button',{name:/Ocultas/}));
  expect(filters.getByRole('button',{name:/Ocultas/})).toHaveAttribute('aria-pressed','true');
});
it("confirmação de congelamento envia um único contrato pendente",async()=>{
  api.get.mockResolvedValue({data:[{id:8,nome:"Leitor",email:"leitor@example.test",bloqueado:false,role:"CLIENTE",createdAt:"2026-10-13",totalPedidos:0,multaTotal:0}]});
  api.patch.mockImplementation(()=>new Promise(()=>{}));
  renderWithRouter(<AdminUsers/>);const user=userEvent.setup();
  await user.click(await screen.findByRole("button",{name:"Congelar",exact:true}));
  const dialog=screen.getByRole("dialog");
  await user.dblClick(within(dialog).getByRole("button",{name:/Confirmar/i}));
  expect(api.patch).toHaveBeenCalledExactlyOnceWith("/admin/usuarios/8/bloqueio",{bloqueado:true});
  expect(within(dialog).getByRole("button",{name:"Fechar diálogo"})).toBeDisabled();
});
it("erro ao salvar preserva formulário e FormData do livro",async()=>{
  api.get.mockResolvedValue({data:livroDisponivel});
  api.put.mockRejectedValue({response:{data:{erro:"Não foi possível salvar"}}});
  renderWithRouter(<Routes><Route path="/editar-livro/:id" element={<EditBook/>}/></Routes>,{route:"/editar-livro/7"});
  const user=userEvent.setup();const stock=await screen.findByLabelText("Estoque");
  await user.clear(stock);await user.type(stock,"7");
  await user.click(screen.getByRole("button",{name:/Salvar/i}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível salvar");
  expect(stock).toHaveValue(7);
  const [url,data]=api.put.mock.calls[0];expect(url).toBe("/livros/7");expect(data.get("estoque")).toBe("7");expect(data.get("titulo")).toBe(livroDisponivel.titulo);
});
