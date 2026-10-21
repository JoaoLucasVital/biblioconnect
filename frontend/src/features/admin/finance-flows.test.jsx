import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import AdminFinance from "../../pages/AdminFinance.jsx";
import { renderWithRouter } from "../../test/renderWithRouter.jsx";
import api from "../../api/api.js";

vi.mock("../../api/api.js", () => ({ default: { get: vi.fn(), patch: vi.fn() } }));
const order = (id, statusPagamento, tipo, titulo, nome) => ({ id, statusPagamento, tipo, valor: 45.5, createdAt: "2026-10-13T12:00:00Z", livro: { titulo }, usuario: { nome } });
const data = { totalRecebido: 125.5, totalPendente: 45.5, totalCompras: 125.5, totalAlugueis: 0, totalReservasMultas: 0, totalEstornado: 0, totalCanceladoPagamento: 0, pedidosPagos: 1, pedidosPendentes: 1, pedidosCanceladosPagamento: 0, pedidosEstornados: 0, porTipo: [], porPagamento: [], pedidosRecentes: [order(8, "pendente", "compra", "Dom Casmurro", "Ana Lima"), order(9, "pago", "aluguel", "O Cortiço", "Carlos Souza")] };
beforeEach(() => { api.get.mockReset(); api.patch.mockReset(); });

it("falha inicial não apresenta zeros como valores válidos e permite tentar novamente", async () => {
  api.get.mockRejectedValueOnce({ response: { data: { erro: "Serviço indisponível" } } }).mockResolvedValueOnce({ data });
  renderWithRouter(<AdminFinance />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Serviço indisponível");
  expect(screen.queryAllByText(/R\$\s*0,00/)).toHaveLength(0);
  await userEvent.setup().click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByRole("table")).toBeInTheDocument();
  expect(api.get).toHaveBeenNthCalledWith(2, "/admin/financeiro");
});

it("filtra somente os pedidos carregados por busca, status e tipo sem nova requisição", async () => {
  api.get.mockResolvedValue({ data });
  renderWithRouter(<AdminFinance />);
  const user = userEvent.setup();
  await screen.findByRole("table");
  await user.selectOptions(screen.getByLabelText("Pagamento"), "pendente");
  expect(screen.getByText("Dom Casmurro")).toBeInTheDocument();
  expect(screen.queryByText("O Cortiço")).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Tipo de pedido"), "aluguel");
  expect(screen.getByText("Nenhum pedido corresponde aos filtros")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
  await user.type(screen.getByRole("searchbox", { name: "Buscar pedidos" }), "carlos");
  expect(screen.getByText("O Cortiço")).toBeInTheDocument();
  expect(screen.queryByText("Dom Casmurro")).not.toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(1);
});

it("preserva confirmação, cancelamento, payload e bloqueio de envio repetido", async () => {
  api.get.mockResolvedValue({ data });
  let resolve;
  api.patch.mockImplementation(() => new Promise(done => { resolve = done; }));
  renderWithRouter(<AdminFinance />);
  const user = userEvent.setup();
  const row = (await screen.findByText("Dom Casmurro")).closest("tr");
  await user.click(within(row).getByRole("button", { name: "Marcar pago" }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Voltar" }));
  expect(api.patch).not.toHaveBeenCalled();
  await user.click(within(row).getByRole("button", { name: "Marcar pago" }));
  const dialog = screen.getByRole("dialog");
  await user.dblClick(within(dialog).getByRole("button", { name: "Confirmar" }));
  expect(api.patch).toHaveBeenCalledExactlyOnceWith("/admin/pedidos/8/pagamento", { statusPagamento: "pago" });
  expect(within(dialog).getByRole("button", { name: "Voltar" })).toBeDisabled();
  await act(async () => { resolve({ data: {} }); });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(api.get).toHaveBeenCalledTimes(2);
});

it("exibe erro no diálogo e preserva o pedido quando o pagamento falha", async () => {
  api.get.mockResolvedValue({ data });
  api.patch.mockRejectedValue({ response: { data: { erro: "Pagamento recusado" } } });
  renderWithRouter(<AdminFinance />);
  const user = userEvent.setup();
  await user.click(within((await screen.findByText("Dom Casmurro")).closest("tr")).getByRole("button", { name: "Estornar" }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }));
  expect(await within(screen.getByRole("dialog")).findByRole("alert")).toHaveTextContent("Pagamento recusado");
  expect(api.patch).toHaveBeenCalledExactlyOnceWith("/admin/pedidos/8/pagamento", { statusPagamento: "estornado" });
});

it("distingue valores zerados válidos de falha e mostra estados vazios", async () => {
  api.get.mockResolvedValue({ data: { ...data, totalRecebido: 0, totalPendente: 0, pedidosPagos: 0, pedidosPendentes: 0, pedidosRecentes: [] } });
  renderWithRouter(<AdminFinance />);
  expect(await screen.findByText("Nenhuma movimentação financeira")).toBeInTheDocument();
  expect(screen.getAllByText(/R\$\s*0,00/).length).toBeGreaterThan(0);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("preserva o último resultado e bloqueia ações após uma falha de atualização", async () => {
  api.get.mockResolvedValueOnce({ data }).mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce({ data });
  renderWithRouter(<AdminFinance />);
  const user = userEvent.setup();
  await screen.findByRole("table");
  await user.click(screen.getByRole("button", { name: "Atualizar dados" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Os valores abaixo são da última consulta");
  const row = screen.getByText("Dom Casmurro").closest("tr");
  expect(within(row).getByRole("button", { name: "Marcar pago" })).toBeDisabled();
  expect(screen.getByRole("article", { name: "Receita aprovada" })).toHaveTextContent(/R\$\s*125,50/);
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(within(row).getByRole("button", { name: "Marcar pago" })).toBeEnabled();
});

it("mantém todos os status de filtro e permite voltar pagamento aprovado para pendente", async () => {
  api.get.mockResolvedValue({ data });
  api.patch.mockResolvedValue({ data: {} });
  renderWithRouter(<AdminFinance />);
  const user = userEvent.setup();
  await screen.findByRole("table");
  expect([...screen.getByLabelText("Pagamento").options].map(option => option.value)).toEqual(["todos", "pendente", "pago", "cancelado", "estornado"]);
  const row = screen.getByText("O Cortiço").closest("tr");
  expect(within(row).getByRole("button", { name: "Marcar pago" })).toBeDisabled();
  await user.click(within(row).getByRole("button", { name: "Pendente" }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmar" }));
  expect(api.patch).toHaveBeenCalledExactlyOnceWith("/admin/pedidos/9/pagamento", { statusPagamento: "pendente" });
});
