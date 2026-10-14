import { useState } from "react";
import { ArrowUpRight, Banknote, Check, CircleDollarSign, Clock3, CornerUpLeft, XCircle } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatarMoeda } from "./finance-format.js";

const quantity = value => Math.max(0, Number(value) || 0);
const percentage = value => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const countLabel = value => `${value.toLocaleString("pt-BR")} ${value === 1 ? "pedido" : "pedidos"}`;

function MoneyCard({ label, value, count, icon: Icon, featured }) {
  return <article className={`money-card${featured ? " money-card-featured" : ""}`}>
    <div className="money-card-heading"><span>{label}</span><span className="money-card-icon"><Icon size={19} aria-hidden="true" /></span></div>
    <strong className="money-card-value">{formatarMoeda(value)}</strong>
    <div className="money-card-footer"><span>{countLabel(quantity(count))}</span><span className="money-card-badge">{featured ? <><Check size={12} aria-hidden="true" />Confirmada</> : "Acumulado"}</span></div>
    {featured && <p className="money-card-note">Valor recebido em pagamentos aprovados<ArrowUpRight size={14} aria-hidden="true" /></p>}
  </article>;
}

function ApprovalGauge({ pagamentos }) {
  const total = pagamentos.reduce((sum, item) => sum + item.quantidade, 0);
  const approved = pagamentos[0].quantidade;
  const rate = total ? approved / total * 100 : 0;
  return <article className="finance-panel finance-approval">
    <header className="finance-panel-heading"><div><span className="finance-eyebrow">Situação dos pedidos</span><h2>Status de pagamentos</h2><p>Proporção de pedidos com pagamento aprovado.</p></div></header>
    <div className="approval-gauge" role="img" aria-label={total ? `${percentage(rate)} dos pedidos com pagamento aprovado` : "Sem pedidos registrados"}>
      <svg viewBox="0 0 240 142" aria-hidden="true"><path d="M 24 120 A 96 96 0 0 1 216 120" pathLength="100" className="approval-gauge-track" />{rate > 0 && <path d="M 24 120 A 96 96 0 0 1 216 120" pathLength="100" strokeDasharray={`${rate} 100`} className="approval-gauge-fill" />}</svg>
      <div><strong>{total ? percentage(rate) : "—"}</strong><span>{total ? "pagamentos aprovados" : "Sem pedidos para calcular"}</span></div>
    </div>
    {total > 0 && <p className="approval-count">{approved.toLocaleString("pt-BR")} de {countLabel(total)}</p>}
    <dl className="approval-statuses">{pagamentos.map(item => <div key={item.nome}><dt><i style={{ background: item.cor }} aria-hidden="true" />{item.nome}</dt><dd>{countLabel(item.quantidade)}</dd></div>)}</dl>
  </article>;
}

function RevenueDonut({ receitas }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const total = receitas.reduce((sum, item) => sum + item.valor, 0);
  const activeName = hovered ?? selected;
  const active = receitas.find(item => item.nome === activeName);
  const label = active?.nome || "Receita total";
  const value = active?.valor ?? total;
  const clear = () => { setSelected(null); setHovered(null); };
  return <section className="finance-panel finance-revenue-donut" aria-labelledby="finance-revenue-heading">
    <header className="finance-panel-heading"><div><span className="finance-eyebrow">Composição da receita</span><h2 id="finance-revenue-heading">Receita aprovada por tipo</h2><p>Selecione uma categoria para explorar os valores.</p></div><span className="finance-tag">Acumulado</span></header>
    <div className="revenue-explorer">
      {total > 0 ? <div className="revenue-donut-wrap"><div className="revenue-donut" role="img" aria-label="Distribuição da receita aprovada. Valores disponíveis na legenda interativa."><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart accessibilityLayer={false}><Pie data={receitas} dataKey="valor" nameKey="nome" innerRadius="72%" outerRadius="90%" startAngle={90} endAngle={-270} paddingAngle={receitas.filter(item => item.valor > 0).length > 1 ? 4 : 0} cornerRadius={5} stroke="none" isAnimationActive={false} onMouseEnter={(_, index) => setHovered(receitas[index].nome)} onMouseLeave={() => setHovered(null)}>{receitas.map(item => <Cell key={item.nome} fill={item.cor} opacity={active && item.nome !== active.nome ? .22 : 1} />)}</Pie></PieChart></ResponsiveContainer></div><div className="revenue-donut-center" aria-hidden="true"><span>{label}</span><strong>{formatarMoeda(value)}</strong>{active && <small>{percentage(value / total * 100)} da receita</small>}</div></div> : <div className="finance-empty finance-chart-empty"><span className="finance-empty-icon"><Banknote size={24} aria-hidden="true" /></span><h3>Nenhuma receita aprovada</h3><p>As receitas aparecerão após a aprovação dos pagamentos.</p></div>}
      <div className="revenue-legend"><p className="revenue-legend-hint">Distribuição por origem</p>{receitas.map(item => <button key={item.nome} type="button" aria-pressed={selected === item.nome} data-active={active?.nome === item.nome || undefined} onClick={() => setSelected(selected === item.nome ? null : item.nome)} onMouseEnter={() => setHovered(item.nome)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(item.nome)} onBlur={() => setHovered(null)}><i style={{ background: item.cor }} aria-hidden="true" /><span>{item.nome}<small>{total > 0 ? `${percentage(item.valor / total * 100)} da receita` : "Sem receita registrada"}</small></span><strong>{formatarMoeda(item.valor)}</strong></button>)}<button type="button" className="revenue-reset" onClick={clear}>Ver receita total<ArrowUpRight size={14} aria-hidden="true" /></button></div>
    </div><p className="sr-only" role="status">{label}: {formatarMoeda(value)}</p>
  </section>;
}

export default function FinanceOverview({ financeiro }) {
  const receitas = [
    { nome: "Compras pagas", valor: quantity(financeiro.totalCompras), cor: "var(--fin-navy)" },
    { nome: "Aluguéis pagos", valor: quantity(financeiro.totalAlugueis), cor: "var(--fin-orange)" },
    { nome: "Reservas / multas pagas", valor: quantity(financeiro.totalReservasMultas), cor: "var(--fin-slate)" },
  ];
  const pagamentos = [
    { nome: "Pago", quantidade: quantity(financeiro.pedidosPagos), cor: "var(--fin-navy)" },
    { nome: "Pendente", quantidade: quantity(financeiro.pedidosPendentes), cor: "var(--fin-orange)" },
    { nome: "Cancelado", quantidade: quantity(financeiro.pedidosCanceladosPagamento), cor: "var(--fin-slate)" },
    { nome: "Estornado", quantidade: quantity(financeiro.pedidosEstornados), cor: "var(--fin-clay)" },
  ];
  return <><section className="finance-money-grid" aria-label="Resumo financeiro">
    <MoneyCard label="Receita aprovada" value={financeiro.totalRecebido} count={financeiro.pedidosPagos} icon={CircleDollarSign} featured />
    <MoneyCard label="Total pendente" value={financeiro.totalPendente} count={financeiro.pedidosPendentes} icon={Clock3} />
    <MoneyCard label="Valor estornado" value={financeiro.totalEstornado} count={financeiro.pedidosEstornados} icon={CornerUpLeft} />
    <MoneyCard label="Pagamentos cancelados" value={financeiro.totalCanceladoPagamento} count={financeiro.pedidosCanceladosPagamento} icon={XCircle} />
  </section><section className="finance-visual-grid" aria-label="Distribuição financeira"><RevenueDonut receitas={receitas} /><ApprovalGauge pagamentos={pagamentos} /></section></>;
}
