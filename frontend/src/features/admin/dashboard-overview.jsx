import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, BookOpen, Bookmark, Check, CircleAlert, LibraryBig, ShoppingBag, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "./dashboard.css";
import {AnimatedHeading} from '../../components/motion/TextAnimations.jsx';

const number = (value) => Number(value || 0).toLocaleString("pt-BR");
const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function EmptyChart({ title, children, icon: Icon = BookOpen }) {
  return <div className="dashboard-empty">
    <span className="dashboard-empty-icon"><Icon size={25} strokeWidth={1.4} aria-hidden="true" /></span>
    <h3>{title}</h3><p>{children}</p>
  </div>;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return <div className="dashboard-tooltip"><strong>{payload[0].payload.nome}</strong><span>{number(payload[0].value)} registros</span></div>;
}

function PanelHeading({ index, title, children, aside }) {
  return <header className="dashboard-panel-heading"><div><span className="dashboard-eyebrow">{index}</span><h2>{title}</h2>{children && <p>{children}</p>}</div>{aside}</header>;
}

function Ranking({ items, kind }) {
  const isBook = kind === "book";
  const max = Math.max(...items.map((item) => Number(item.quantidadeVendas) || 0), 1);
  if (!items.length) return <EmptyChart title={isBook ? "Nenhum livro no ranking" : "Sem gêneros ranqueados"} icon={isBook ? BookOpen : LibraryBig}>As vendas que compõem este ranking aparecerão aqui.</EmptyChart>;
  return <ol className={`dashboard-ranking ${isBook ? "dashboard-ranking-books" : "dashboard-ranking-genres"}`}>
    {items.map((item, index) => <li key={item.id || `${item.titulo || item.genero}-${index}`}>
      <span className="dashboard-rank-number">{String(index + 1).padStart(2, "0")}</span>
      <div className="dashboard-rank-content"><span className="dashboard-rank-name">{isBook ? item.titulo : item.genero}</span><div className="dashboard-rank-track" aria-hidden="true"><span style={{ width: `${(Number(item.quantidadeVendas) || 0) / max * 100}%` }} /></div></div>
      <span className="dashboard-rank-value">{number(item.quantidadeVendas)}<small>{Number(item.quantidadeVendas) === 1 ? "venda" : "vendas"}</small></span>
    </li>)}
  </ol>;
}

export default function DashboardOverview({ stats }) {
  const movements = [
    { nome: "Reservas", valor: stats.reservas, cor: "var(--dash-navy)" },
    { nome: "Vendas", valor: stats.vendas, cor: "var(--dash-orange)" },
    { nome: "Aluguéis", valor: stats.alugueis, cor: "var(--dash-slate)" },
    { nome: "Atrasos", valor: stats.atrasos, cor: "var(--dash-clay)" },
  ];
  const metrics = [
    { label: "Reservas", value: stats.reservas, text: "Interesse pelo acervo", icon: Bookmark, to: "/admin/pedidos" },
    { label: "Vendas", value: stats.vendas, text: "Compras registradas", icon: ShoppingBag, to: "/admin/pedidos", accent: true },
    { label: "Aluguéis", value: stats.alugueis, text: "Circulação de livros", icon: ArrowDownLeft, to: "/admin/pedidos" },
    { label: "Livros", value: stats.livros, text: "Títulos no catálogo", icon: LibraryBig, to: "/admin/livros" },
  ];
  const activeUsers = Math.max(stats.usuarios - stats.usuariosBloqueados, 0);
  const hasMovements = movements.some((item) => Number(item.valor) > 0);
  return <>
    <header className="dashboard-header">
      <div><p className="dashboard-breadcrumb">Administração <span aria-hidden="true">/</span> Painel</p><AnimatedHeading>Visão geral da biblioteca<span>.</span></AnimatedHeading><p className="dashboard-intro">O acervo, os leitores e a operação, em perspectiva.</p></div>
      <div className="dashboard-header-actions"><Link className="dashboard-secondary-link" to="/admin/financeiro">Ver financeiro<ArrowUpRight size={16} aria-hidden="true"/></Link><Link className="dashboard-primary-link" to="/admin/pedidos">Gerenciar pedidos <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
    </header>

    <section className="dashboard-kpis" aria-label="Indicadores da biblioteca">
      {metrics.map(({ label, value, text, icon: Icon, to, accent }) => <Link to={to} key={label} className={`dashboard-kpi${accent ? " dashboard-kpi-accent" : ""}`}>
        <div className="dashboard-kpi-top"><span>{label}</span><Icon size={19} strokeWidth={1.5} aria-hidden="true" /></div><strong>{number(value)}</strong><div className="dashboard-kpi-foot"><small>{text}</small><ArrowUpRight size={15} aria-hidden="true" /></div>
      </Link>)}
    </section>

    <div className="dashboard-overview-grid">
      <section className="dashboard-panel dashboard-movements">
        <PanelHeading index="01 / Operação" title="Movimentações da biblioteca" aside={<span className="dashboard-period">Dados consolidados</span>}>Reservas, vendas, aluguéis e atrasos registrados.</PanelHeading>
        {hasMovements ? <div className="dashboard-chart" role="img" aria-label={movements.map((item) => `${item.nome}: ${number(item.valor)}`).join("; ")}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={movements} layout="vertical" margin={{ top: 12, right: 40, bottom: 4, left: 0 }} barSize={28} accessibilityLayer>
              <CartesianGrid horizontal={false} stroke="var(--dash-line)" strokeDasharray="3 5" />
              <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
              <YAxis type="category" dataKey="nome" width={72} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--dash-soft)" }} />
              <Bar dataKey="valor" isAnimationActive={false} radius={[0, 4, 4, 0]}>{movements.map((item) => <Cell key={item.nome} fill={item.cor} />)}<LabelList dataKey="valor" position="right" formatter={number} fill="var(--text)" fontSize={12} /></Bar>
            </BarChart>
          </ResponsiveContainer>
        </div> : <EmptyChart title="A operação começa aqui" icon={Bookmark}>Ainda não há reservas, vendas, aluguéis ou atrasos registrados. Os dados aparecerão conforme a biblioteca movimentar o acervo.</EmptyChart>}
        <div className="dashboard-chart-summary">{movements.map((item) => <div key={item.nome}><span><i style={{ background: item.cor }} aria-hidden="true" />{item.nome}</span><strong>{number(item.valor)}</strong></div>)}</div>
      </section>

      <aside className="dashboard-summary-stack" aria-label="Resumos operacionais">
        <section className={`dashboard-attention${stats.atrasos > 0 ? " has-pending" : ""}`}>
          <div className="dashboard-section-label"><span>Acompanhamento</span>{stats.atrasos > 0 ? <CircleAlert size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}</div>
          <h2>{stats.atrasos > 0 ? "Pendências para acompanhar" : "Sem atrasos registrados"}</h2>
          <div className="dashboard-attention-numbers"><div><strong>{number(stats.atrasos)}</strong><span>Atrasos</span></div><div><strong>{money(stats.multasPendentes)}</strong><span>Multas pendentes</span></div></div>
          <Link to="/admin/atrasos">Atrasos e multas <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </section>
        <section className="dashboard-readers">
          <div className="dashboard-section-label"><span>Status de usuários</span><Users size={18} aria-hidden="true" /></div>
          <div className="dashboard-readers-total"><strong>{number(stats.usuarios)}</strong><span>Usuários cadastrados</span></div>
          {stats.usuarios > 0 && <div className="dashboard-users-track" aria-hidden="true"><span style={{ flex: activeUsers }} /><span style={{ flex: stats.usuariosBloqueados }} /></div>}
          <dl><div><dt><i aria-hidden="true" />Ativos</dt><dd>{number(activeUsers)}</dd></div><div><dt><i aria-hidden="true" />Congelados</dt><dd>{number(stats.usuariosBloqueados)}</dd></div></dl>
          {stats.usuarios === 0 && <p className="dashboard-no-users">A distribuição será exibida após os primeiros cadastros.</p>}
          <Link to="/admin/usuarios">Gerenciar usuários <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </section>
      </aside>
    </div>

    <div className="dashboard-rankings-grid">
      <section className="dashboard-panel"><PanelHeading index="02 / Acervo em destaque" title="Livros mais vendidos">Ranking por compras registradas.</PanelHeading>
        {stats.livroMaisVendido && <div className="dashboard-leader"><span className="dashboard-leader-caption">Livro mais vendido</span><strong>{stats.livroMaisVendido.titulo}</strong><span>{number(stats.livroMaisVendido.quantidadeVendas)} {Number(stats.livroMaisVendido.quantidadeVendas) === 1 ? "venda registrada" : "vendas registradas"}</span></div>}
        <Ranking items={stats.livrosMaisVendidos} kind="book" />
      </section>
      <section className="dashboard-panel"><PanelHeading index="03 / Preferências dos leitores" title="Gêneros mais vendidos">Distribuição das vendas por categoria.</PanelHeading>
        {stats.generoMaisVendido && <div className="dashboard-leader dashboard-leader-genre"><span className="dashboard-leader-caption">Gênero mais vendido</span><strong>{stats.generoMaisVendido.genero}</strong><span>{number(stats.generoMaisVendido.quantidadeVendas)} {Number(stats.generoMaisVendido.quantidadeVendas) === 1 ? "venda registrada" : "vendas registradas"}</span></div>}
        <Ranking items={stats.generosMaisVendidos} kind="genre" />
      </section>
    </div>

    <section className="dashboard-shortcuts" aria-labelledby="dashboard-shortcuts-title"><div><span className="dashboard-eyebrow">Continue por aqui</span><h2 id="dashboard-shortcuts-title">A biblioteca em movimento.</h2></div><nav aria-label="Atalhos de gestão">
      <Link to="/admin/livros"><LibraryBig size={19} aria-hidden="true" /><span>Gerenciar livros<small>Editar e organizar o acervo</small></span><ArrowUpRight size={17} aria-hidden="true" /></Link>
      <Link to="/admin/usuarios"><Users size={19} aria-hidden="true" /><span>Usuários<small>Clientes, multas e bloqueios</small></span><ArrowUpRight size={17} aria-hidden="true" /></Link>
    </nav></section>
  </>;
}
