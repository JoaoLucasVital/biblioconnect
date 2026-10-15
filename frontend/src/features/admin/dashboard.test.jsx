import {screen,within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach,it,expect,vi} from "vitest";
import AdminDashboard from "../../pages/AdminDashboard.jsx";
import {renderWithRouter} from "../../test/renderWithRouter.jsx";
import api from "../../api/api.js";
vi.mock("../../api/api.js",()=>({default:{get:vi.fn(),post:vi.fn()}}));
const stats={reservas:0,vendas:0,alugueis:0,usuarios:2,usuariosBloqueados:0,livros:22,atrasos:0,multasPendentes:0,livrosMaisVendidos:[],generosMaisVendidos:[]};
beforeEach(()=>{api.get.mockReset();api.post.mockReset();api.get.mockResolvedValue({data:stats});});
it("falha de carga não publica indicadores zerados e permite tentar novamente",async()=>{
  api.get.mockRejectedValueOnce({response:{data:{erro:"Conexão indisponível"}}});
  renderWithRouter(<AdminDashboard/>);
  expect(await screen.findByRole("alert")).toHaveTextContent("Conexão indisponível");
  expect(screen.queryByRole("region",{name:"Indicadores da biblioteca"})).not.toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"Abrir área restrita"})).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button",{name:"Tentar novamente"}));
  const metrics=await screen.findByRole("region",{name:"Indicadores da biblioteca"});
  expect(within(metrics).getByText("22")).toBeVisible();
  expect(api.get).toHaveBeenCalledTimes(2);
});
it("dados zerados válidos conservam métricas e acesso ao financeiro",async()=>{
  renderWithRouter(<AdminDashboard/>);
  const metrics=await screen.findByRole("region",{name:"Indicadores da biblioteca"});
  expect(within(metrics).getAllByText("0")).toHaveLength(3);
  expect(screen.getByRole("link",{name:"Ver financeiro"})).toHaveAttribute("href","/admin/financeiro");
});
it("painel publicado não oferece reset de apresentação nem apaga dados",async()=>{
  renderWithRouter(<AdminDashboard/>);
  await screen.findByRole("region",{name:"Indicadores da biblioteca"});
  expect(screen.queryByRole("button",{name:"Abrir área restrita"})).not.toBeInTheDocument();
  expect(screen.queryByText(/Resetar dados para apresentação/)).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});
