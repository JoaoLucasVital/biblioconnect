import StatusMessage from "../components/ui/StatusMessage.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import Button from "../components/ui/Button.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Não informado";
  return new Date(data).toLocaleDateString("pt-BR");
}

function traduzirTipo(tipo) {
  const tipos = {
    compra: "Compra",
    reserva: "Reserva",
    aluguel: "Aluguel",
  };

  return tipos[tipo] || tipo;
}

function traduzirPagamento(status) {
  const statusMap = {
    pendente: "Pendente",
    pago: "Pago",
    cancelado: "Cancelado",
    estornado: "Estornado",
  };

  return statusMap[status] || status;
}

function AdminFinance() {
  const [financeiro, setFinanceiro] = useState({
    totalRecebido: 0,
    totalPendente: 0,
    totalCompras: 0,
    totalAlugueis: 0,
    totalReservasMultas: 0,
    totalEstornado: 0,
    totalCanceladoPagamento: 0,
    pedidosPagos: 0,
    pedidosPendentes: 0,
    pedidosCanceladosPagamento: 0,
    pedidosEstornados: 0,
    porTipo: [],
    porPagamento: [],
    pedidosRecentes: [],
  });

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [pedidoAcao, setPedidoAcao] = useState(null);
  const [novoPagamento, setNovoPagamento] = useState("");
  const [processando, setProcessando] = useState(false);

  const carregarFinanceiro = useCallback(async () => {
    try {

      const response = await api.get("/admin/financeiro");

      setFinanceiro({
        totalRecebido: response.data.totalRecebido || 0,
        totalPendente: response.data.totalPendente || 0,
        totalCompras: response.data.totalCompras || 0,
        totalAlugueis: response.data.totalAlugueis || 0,
        totalReservasMultas: response.data.totalReservasMultas || 0,
        totalEstornado: response.data.totalEstornado || 0,
        totalCanceladoPagamento: response.data.totalCanceladoPagamento || 0,
        pedidosPagos: response.data.pedidosPagos || 0,
        pedidosPendentes: response.data.pedidosPendentes || 0,
        pedidosCanceladosPagamento:
          response.data.pedidosCanceladosPagamento || 0,
        pedidosEstornados: response.data.pedidosEstornados || 0,
        porTipo: response.data.porTipo || [],
        porPagamento: response.data.porPagamento || [],
        pedidosRecentes: response.data.pedidosRecentes || [],
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.erro ||
          "Erro ao carregar dados financeiros.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  function abrirPagamento(pedido, statusPagamento) {
    setPedidoAcao(pedido);
    setNovoPagamento(statusPagamento);
  }

  function fecharPagamento() {
    setPedidoAcao(null);
    setNovoPagamento("");
  }

  async function confirmarPagamento() {
    if (!pedidoAcao || !novoPagamento || processando) return;

    try {
      setProcessando(true);
      setFeedback({ type: "", text: "" });

      await api.patch(`/admin/pedidos/${pedidoAcao.id}/pagamento`, {
        statusPagamento: novoPagamento,
      });

      setFeedback({
        type: novoPagamento === "pago" ? "success" : "danger",
        text:
          novoPagamento === "pago"
            ? "Pagamento aprovado. O valor agora entrou na receita."
            : "Status de pagamento atualizado. O valor foi removido da receita aprovada.",
      });

      fecharPagamento();
      carregarFinanceiro();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.response?.data?.erro ||
          "Erro ao alterar status de pagamento.",
      });
    } finally {
      setProcessando(false);
    }
  }

  useInitialLoad(carregarFinanceiro);

  const tipoChart = useMemo(
    () =>
      financeiro.porTipo.map((item) => ({
        nome: item.nome,
        valor: Number(item.valor || 0),
      })),
    [financeiro.porTipo]
  );

  const pagamentoChart = useMemo(
    () =>
      financeiro.porPagamento.map((item) => ({
        name: item.nome,
        value: Number(item.quantidade || 0),
      })),
    [financeiro.porPagamento]
  );

  const pagamentoColors = ["#15803d", "#e67e00", "#b91c1c", "#475569"];

  if (loading) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando financeiro...</p>
        </div>
      </main>
    );
  }

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <section  className="mb-8 flex flex-wrap items-start justify-between gap-6 [&_h1]:font-display [&_h1]:text-4xl [&_p]:mt-3 [&_p]:max-w-xl [&_p]:text-sm [&_p]:text-muted">
          <div>
            <span  className="mb-3 block text-xs uppercase tracking-[0.16em] text-muted">Controle financeiro</span>

            <h1  className="font-display text-4xl leading-tight sm:text-5xl">Financeiro da biblioteca</h1>

            <p>
              Acompanhe apenas receitas aprovadas, pagamentos pendentes,
              estornos e movimentações financeiras da plataforma.
            </p>
          </div>

          <div  className="grid gap-2 border-l-2 border-accent pl-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:font-display [&_strong]:text-3xl">
            <span>Receita aprovada</span>
            <strong>{formatarMoeda(financeiro.totalRecebido)}</strong>
          </div>
        </section>

        {feedback.text && (
          <StatusMessage type={feedback.type}>
            {feedback.text}
          </StatusMessage>
        )}

        <section  className="my-5 border-l-2 border-stroke pl-4 text-sm text-muted">
          <strong>Regra financeira ativa</strong>
          <p>
            Valores pendentes, estornados ou cancelados não entram como receita.
            O sistema só soma em compras, aluguéis e reservas/multas quando o
            pagamento estiver aprovado.
          </p>
        </section>

        <section  className="my-8 grid grid-cols-2 gap-5 xl:grid-cols-4">
          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-2xl">
            <span>Receita aprovada</span>
            <strong>{formatarMoeda(financeiro.totalRecebido)}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-2xl border-accent">
            <span>Total pendente</span>
            <strong>{formatarMoeda(financeiro.totalPendente)}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-2xl">
            <span>Compras pagas</span>
            <strong>{formatarMoeda(financeiro.totalCompras)}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-2xl">
            <span>Aluguéis pagos</span>
            <strong>{formatarMoeda(financeiro.totalAlugueis)}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-2xl">
            <span>Reservas/multas pagas</span>
            <strong>{formatarMoeda(financeiro.totalReservasMultas)}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-2xl">
            <span>Pedidos pagos</span>
            <strong>{financeiro.pedidosPagos}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-2xl">
            <span>Pagamentos pendentes</span>
            <strong>{financeiro.pedidosPendentes}</strong>
          </div>

          <div  className="grid min-w-0 gap-2 border-t border-stroke py-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-display [&_strong]:text-2xl">
            <span>Valor estornado</span>
            <strong>{formatarMoeda(financeiro.totalEstornado)}</strong>
          </div>
        </section>

        <section  className="my-8 grid min-w-0 gap-7 xl:grid-cols-2">
          <div  className="min-w-0 border-t border-stroke pt-6">
            <div  className="mb-5 [&_h2]:font-display [&_h2]:text-xl [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
              <div>
                <h2  className="font-display text-2xl leading-snug">Receita aprovada por tipo</h2>
                <p>Somente pagamentos aprovados entram neste gráfico.</p>
              </div>
            </div>

            <div  className="h-72 min-w-0 w-full">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={tipoChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6dde7"/>
                  <XAxis dataKey="nome" tick={{ fill: "#5b6676", fontSize: 12 }}/>
                  <YAxis tick={{ fill: "#5b6676", fontSize: 12 }}/>
                  <Tooltip formatter={(value) => formatarMoeda(value)}/>
                  <Bar dataKey="valor" fill="#1E3A5F" radius={[8, 8, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div  className="min-w-0 border-t border-stroke pt-6">
            <div  className="mb-5 [&_h2]:font-display [&_h2]:text-xl [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
              <div>
                <h2  className="font-display text-2xl leading-snug">Status de pagamentos</h2>
                <p>Quantidade de pedidos por situação financeira.</p>
              </div>
            </div>

            <div  className="h-72 min-w-0 w-full">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={pagamentoChart} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                    {pagamentoChart.map((entry, index) => (
                      <Cell key={entry.name} fill={pagamentoColors[index % pagamentoColors.length]}/>
                    ))}
                  </Pie>
                  <Tooltip/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section  className="mt-10">
          <div  className="mb-6 flex flex-wrap justify-between gap-4 [&_h2]:font-display [&_h2]:text-2xl [&_p]:text-sm [&_p]:text-muted">
            <div>
              <span  className="mb-3 block text-xs uppercase tracking-[0.16em] text-muted">Movimentações recentes</span>
              <h2  className="font-display text-2xl leading-snug">Pedidos financeiros</h2>
            </div>
          </div>

          {financeiro.pedidosRecentes.length === 0 ? (
            <div  className="my-8 border-y border-stroke py-12 text-muted [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">
              <h2  className="font-display text-2xl leading-snug">Nenhuma movimentação financeira</h2>
              <p>Quando pedidos forem criados, eles aparecerão aqui.</p>
            </div>
          ) : (
            <div  className="grid gap-6">
              {financeiro.pedidosRecentes.map((pedido) => (
                <article key={pedido.id} className="grid min-w-0 gap-4 border-t border-stroke py-6 [&_h3]:wrap-anywhere [&_h3]:font-display [&_h3]:text-xl [&_p]:text-sm [&_small]:text-xs [&_small]:text-muted">
                  <div>
                    <h3>{pedido.livro?.titulo}</h3>

                    <p>
                      {traduzirTipo(pedido.tipo)} de{" "}
                      <strong>{pedido.usuario?.nome}</strong>
                    </p>

                    <small>
                      Pedido #{pedido.id} • {formatarData(pedido.createdAt)}
                    </small>
                  </div>

                  <div  className="flex flex-wrap items-center gap-4">
                    <span>{formatarMoeda(pedido.valor)}</span>

                    <StatusBadge>
                      {traduzirPagamento(pedido.statusPagamento)}
                    </StatusBadge>
                  </div>

                  <div  className="flex flex-wrap gap-2">
                    <Button onClick={() => abrirPagamento(pedido, "pago")} disabled={pedido.statusPagamento === "pago"} type="button" variant="primary">
                      Marcar pago
                    </Button>

                    <Button onClick={() => abrirPagamento(pedido, "pendente")} disabled={pedido.statusPagamento === "pendente"} type="button" variant="secondary">
                      Pendente
                    </Button>

                    <Button onClick={() => abrirPagamento(pedido, "estornado")} disabled={pedido.statusPagamento === "estornado"} type="button" variant="danger">
                      Estornar
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {pedidoAcao && (
        <Dialog open title={<>Alterar pagamento</>} onClose={fecharPagamento} busy={processando} footer={<div  className="flex flex-wrap justify-end gap-3">
              <Button onClick={fecharPagamento} disabled={processando} type="button" variant="secondary">
                Voltar
              </Button>

              <Button onClick={confirmarPagamento} disabled={processando} type="button" variant={novoPagamento==="estornado" ? "danger" : "primary"}>
                {processando ? "Atualizando..." : "Confirmar"}
              </Button>
            </div>}>
            

            <p>
              Confirmar alteração do pedido{" "}
              <strong>#{pedidoAcao.id}</strong> para{" "}
              <strong>{traduzirPagamento(novoPagamento)}</strong>?
            </p>

            <div  className="grid gap-2 text-sm text-muted">
              <span>Livro: {pedidoAcao.livro?.titulo}</span>
              <span>Cliente: {pedidoAcao.usuario?.nome}</span>
              <span>Valor: {formatarMoeda(pedidoAcao.valor)}</span>
              <span>
                Status atual:{" "}
                {traduzirPagamento(pedidoAcao.statusPagamento)}
              </span>
            </div>

            
          {feedback.type==="error" && feedback.text && <StatusMessage type="error">{feedback.text}</StatusMessage>}</Dialog>
      )}
    </main>
  );
}

export default AdminFinance;
