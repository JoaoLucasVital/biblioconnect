import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import FinanceOverview from "./finance-overview.jsx";

const data = { totalRecebido: 300, totalPendente: 100, totalEstornado: 30, totalCanceladoPagamento: 20, totalCompras: 200, totalAlugueis: 100, totalReservasMultas: 0, pedidosPagos: 2, pedidosPendentes: 1, pedidosEstornados: 1, pedidosCanceladosPagamento: 0 };

it("calcula aprovação pela quantidade de todos os pedidos, sem inferir crescimento", () => {
  render(<FinanceOverview financeiro={data} />);
  expect(screen.getByRole("img", { name: "50% dos pedidos com pagamento aprovado" })).toBeInTheDocument();
  expect(screen.getByText("2 de 4 pedidos" )).toBeInTheDocument();
  expect(screen.queryByText(/crescimento|mês anterior/i)).not.toBeInTheDocument();
});

it("legenda seleciona receita por teclado, conserva o total e permite voltar", async () => {
  const user = userEvent.setup();
  render(<FinanceOverview financeiro={data} />);
  const region = screen.getByRole("region", { name: "Receita aprovada por tipo" });
  const aluguel = within(region).getByRole("button", { name: /Aluguéis pagos/ });
  aluguel.focus(); await user.keyboard("{Enter}");
  expect(aluguel).toHaveAttribute("aria-pressed", "true");
  expect(within(region).getByRole("status")).toHaveTextContent(/Aluguéis pagos.*100,00/);
  expect(within(screen.getByRole("region", { name: "Resumo financeiro" })).getByText(/300,00/)).toBeInTheDocument();
  await user.click(within(region).getByRole("button", { name: "Ver receita total" }));
  expect(aluguel).toHaveAttribute("aria-pressed", "false");
  expect(within(region).getByRole("status")).toHaveTextContent(/Receita total.*300,00/);
});

it("não inventa percentual quando não existem pedidos ou receita", () => {
  render(<FinanceOverview financeiro={{}} />);
  expect(screen.getByText("Sem pedidos para calcular" )).toBeInTheDocument();
  expect(screen.getByText("Nenhuma receita aprovada")).toBeInTheDocument();
  expect(screen.queryByText(/NaN|Infinity|100%/)).not.toBeInTheDocument();
});
