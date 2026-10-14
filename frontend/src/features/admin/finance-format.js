export function formatarMoeda(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
export function formatarData(data) {
  if (!data) return "Não informado";
  const date = new Date(data);
  return Number.isNaN(date.getTime()) ? "Não informado" : date.toLocaleDateString("pt-BR");
}
export function traduzirTipo(tipo) { return ({ compra: "Compra", reserva: "Reserva", aluguel: "Aluguel" })[tipo] || tipo || "Não informado"; }
export function traduzirPagamento(status) { return ({ pendente: "Pendente", pago: "Pago", cancelado: "Cancelado", estornado: "Estornado" })[status] || status || "Não informado"; }
export function normalizarBusca(value) { return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
