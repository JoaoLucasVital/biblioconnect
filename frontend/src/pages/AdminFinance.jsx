import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import FinanceOverview from "../features/admin/finance-overview.jsx";
import FinanceOrders from "../features/admin/finance-orders.jsx";
import { formatarMoeda, traduzirPagamento } from "../features/admin/finance-format.js";
import "../features/admin/finance.css";
import "../features/admin/finance-visuals.css";
import api from "../api/api.js";

export default function AdminFinance() {
  const [financeiro, setFinanceiro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pedidoAcao, setPedidoAcao] = useState(null);
  const [novoPagamento, setNovoPagamento] = useState("");
  const [erroPagamento, setErroPagamento] = useState("");
  const [processando, setProcessando] = useState(false);
  const cargaAtiva = useRef(false);
  const pagamentoAtivo = useRef(false);

  const carregarFinanceiro = useCallback(async () => {
    if (cargaAtiva.current) return;
    cargaAtiva.current = true;
    setLoading(true);
    setErroCarga("");
    try {
      const response = await api.get("/admin/financeiro");
      setFinanceiro(response.data);
    } catch (error) {
      setErroCarga(error.response?.data?.erro || "Erro ao carregar dados financeiros.");
    } finally {
      cargaAtiva.current = false;
      setLoading(false);
    }
  }, []);
  useInitialLoad(carregarFinanceiro);

  function abrirPagamento(pedido, statusPagamento) {
    if (pagamentoAtivo.current || loading || erroCarga) return;
    setPedidoAcao(pedido); setNovoPagamento(statusPagamento); setErroPagamento("");
  }
  function fecharPagamento() {
    if (pagamentoAtivo.current) return;
    setPedidoAcao(null); setNovoPagamento(""); setErroPagamento("");
  }
  async function confirmarPagamento() {
    if (!pedidoAcao || !novoPagamento || pagamentoAtivo.current) return;
    pagamentoAtivo.current = true;
    setProcessando(true); setErroPagamento(""); setFeedback("");
    try {
      await api.patch(`/admin/pedidos/${pedidoAcao.id}/pagamento`, { statusPagamento: novoPagamento });
      setFeedback(novoPagamento === "pago" ? "Pagamento aprovado. O valor agora entrou na receita." : "Status de pagamento atualizado. Apenas pagamentos aprovados entram na receita.");
      setPedidoAcao(null); setNovoPagamento("");
      await carregarFinanceiro();
    } catch (error) {
      setErroPagamento(error.response?.data?.erro || "Erro ao alterar status de pagamento.");
    } finally {
      pagamentoAtivo.current = false; setProcessando(false);
    }
  }

  return <main className="bc-finance" aria-busy={loading || undefined}>
    <header className="finance-header"><div>
      <nav className="finance-breadcrumb" aria-label="Localização"><Link to="/admin">Administração</Link><span aria-hidden="true">/</span><span>Financeiro</span></nav>
      <h1>Finanças da <span>biblioteca.</span></h1><p>Receitas, pagamentos e cada movimentação em um só lugar.</p>
    </div><button type="button" className="finance-refresh" onClick={carregarFinanceiro} disabled={loading || processando}><RefreshCw size={15} aria-hidden="true" />{loading ? "Atualizando..." : "Atualizar dados"}</button></header>
    {feedback && <StatusMessage type="success">{feedback}</StatusMessage>}
    {erroCarga && <section className="finance-error" role="alert"><TriangleAlert size={22} aria-hidden="true" /><div><h2>{financeiro ? "Os dados precisam ser atualizados" : "Não foi possível carregar o financeiro"}</h2><p>{erroCarga}</p>{financeiro && <p>Os valores abaixo são da última consulta. Atualize antes de alterar pagamentos.</p>}</div><button type="button" onClick={carregarFinanceiro} disabled={loading} className="finance-refresh">Tentar novamente</button></section>}
    {!financeiro && loading && <div className="finance-skeleton" role="status" aria-label="Carregando financeiro"><div /><div /><div /><div /><section /><section /><p className="sr-only">Carregando dados financeiros...</p></div>}
    {financeiro && <><FinanceOverview financeiro={financeiro} /><aside className="finance-rule"><ShieldCheck size={17} aria-hidden="true" /><p><strong>Receita reconhecida, sem estimativas.</strong> Somente pagamentos aprovados entram na receita. Pendências, estornos e cancelamentos ficam separados.</p></aside><FinanceOrders pedidos={financeiro.pedidosRecentes || []} onPayment={abrirPagamento} disabled={loading || processando || Boolean(erroCarga)} /></>}
    <footer className="finance-footer"><Link to="/admin"><ArrowLeft size={14} aria-hidden="true" />Voltar ao painel administrativo</Link><span>Valores em reais · BRL</span></footer>
    {pedidoAcao && <Dialog open title="Alterar pagamento" onClose={fecharPagamento} busy={processando} footer={<><Button onClick={fecharPagamento} disabled={processando} type="button" variant="secondary">Voltar</Button><Button onClick={confirmarPagamento} disabled={processando} type="button" variant={novoPagamento === "estornado" ? "danger" : "primary"}>{processando ? "Atualizando..." : "Confirmar"}</Button></>}>
      {erroPagamento && <StatusMessage type="error">{erroPagamento}</StatusMessage>}
      <p>Confirmar alteração do pedido <strong>#{pedidoAcao.id}</strong> para <strong>{traduzirPagamento(novoPagamento)}</strong>?</p>
      <dl className="finance-dialog-details"><div><dt>Livro</dt><dd>{pedidoAcao.livro?.titulo || "Livro não informado"}</dd></div><div><dt>Cliente</dt><dd>{pedidoAcao.usuario?.nome || "Cliente não informado"}</dd></div><div><dt>Valor</dt><dd>{formatarMoeda(pedidoAcao.valor)}</dd></div><div><dt>Status atual</dt><dd>{traduzirPagamento(pedidoAcao.statusPagamento)}</dd></div></dl>
      <p className="text-sm text-muted">{novoPagamento === "pago" ? "O valor deste pedido será incluído na receita aprovada." : "O valor deste pedido não será contabilizado na receita aprovada."}</p>
    </Dialog>}
  </main>;
}
