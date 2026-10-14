import { useMemo, useState } from "react";
import { Check, CornerUpLeft, ListFilter, Search, WalletCards } from "lucide-react";
import { formatarData, formatarMoeda, normalizarBusca, traduzirPagamento, traduzirTipo } from "./finance-format.js";

export default function FinanceOrders({ pedidos, onPayment, disabled }) {
  const [busca, setBusca] = useState("");
  const [pagamento, setPagamento] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const temFiltros = Boolean(busca || pagamento !== "todos" || tipo !== "todos");
  const filtrados = useMemo(() => pedidos.filter(pedido => (pagamento === "todos" || pedido.statusPagamento === pagamento) && (tipo === "todos" || pedido.tipo === tipo) && normalizarBusca([pedido.id, pedido.livro?.titulo, pedido.usuario?.nome, pedido.usuario?.email].join(" ")).includes(normalizarBusca(busca).trim())), [pedidos, busca, pagamento, tipo]);
  function limparFiltros() { setBusca(""); setPagamento("todos"); setTipo("todos"); }
  return <section className="finance-panel finance-orders" aria-labelledby="finance-orders-title">
    <header className="finance-panel-heading"><div><span className="finance-eyebrow">Últimas movimentações</span><h2 id="finance-orders-title">Pedidos financeiros</h2><p>Os {pedidos.length} pedidos mais recentes retornados pelo sistema.</p></div><span className="finance-tag"><WalletCards size={13} aria-hidden="true" />Histórico recente</span></header>
    <div className="finance-filters">
      <label className="finance-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Buscar pedidos" placeholder="Buscar livro, cliente ou pedido" value={busca} onChange={event => setBusca(event.target.value)} /></label>
      <label className="finance-select"><span>Pagamento</span><select value={pagamento} onChange={event => setPagamento(event.target.value)}><option value="todos">Todos os pagamentos</option><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="cancelado">Cancelado</option><option value="estornado">Estornado</option></select></label>
      <label className="finance-select"><span>Tipo de pedido</span><select value={tipo} onChange={event => setTipo(event.target.value)}><option value="todos">Todos os tipos</option><option value="compra">Compra</option><option value="aluguel">Aluguel</option><option value="reserva">Reserva</option></select></label>
    </div>
    <div className="finance-result-count" role="status"><span>{filtrados.length} de {pedidos.length} pedidos recentes</span>{temFiltros && <button type="button" onClick={limparFiltros}>Limpar filtros</button>}</div>
    {filtrados.length ? <div className="finance-table-scroll" role="region" aria-label="Tabela de pedidos financeiros, role horizontalmente para ver todas as colunas" tabIndex={0}><table className="finance-table"><caption className="sr-only">Pedidos financeiros recentes. Os filtros se aplicam somente a estes pedidos.</caption><thead><tr><th scope="col">Pedido / livro</th><th scope="col">Cliente</th><th scope="col">Tipo</th><th scope="col">Valor</th><th scope="col">Pagamento</th><th scope="col">Ações</th></tr></thead><tbody>{filtrados.map(pedido => <tr key={pedido.id}>
      <td><span className="finance-order-ref">#{pedido.id} <span>· {formatarData(pedido.createdAt)}</span></span><strong className="finance-book-title">{pedido.livro?.titulo || "Livro não informado"}</strong></td><td><span className="finance-client-name">{pedido.usuario?.nome || "Cliente não informado"}</span>{pedido.usuario?.email && <small className="finance-client-email">{pedido.usuario.email}</small>}</td><td>{traduzirTipo(pedido.tipo)}</td><td className="finance-money">{formatarMoeda(pedido.valor)}</td><td><span className="finance-payment-status" data-status={pedido.statusPagamento}><i aria-hidden="true" />{traduzirPagamento(pedido.statusPagamento)}</span></td>
      <td><div className="finance-row-actions"><button type="button" disabled={disabled || pedido.statusPagamento === "pago"} onClick={() => onPayment(pedido, "pago")} className="finance-action-paid"><Check size={13} aria-hidden="true" />Marcar pago</button><button type="button" disabled={disabled || pedido.statusPagamento === "pendente"} onClick={() => onPayment(pedido, "pendente")}>Pendente</button><button type="button" disabled={disabled || pedido.statusPagamento === "estornado"} onClick={() => onPayment(pedido, "estornado")} className="finance-action-refund"><CornerUpLeft size={12} aria-hidden="true" />Estornar</button></div></td>
    </tr>)}</tbody></table></div> : <div className="finance-empty"><span className="finance-empty-icon">{temFiltros ? <ListFilter size={23} aria-hidden="true" /> : <WalletCards size={23} aria-hidden="true" />}</span><h3>{temFiltros ? "Nenhum pedido corresponde aos filtros" : "Nenhuma movimentação financeira"}</h3><p>{temFiltros ? "Ajuste a busca ou limpe os filtros para ver os pedidos recentes." : "Quando pedidos forem criados, eles aparecerão aqui para acompanhamento."}</p></div>}
    <p className="finance-table-note">As alterações de pagamento são aplicadas após sua confirmação.</p>
  </section>;
}
