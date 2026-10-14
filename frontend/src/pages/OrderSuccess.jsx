import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  return { compra: "Compra", reserva: "Reserva", aluguel: "Aluguel" }[tipo] || tipo;
}

function traduzirPagamento(status) {
  return {
    pendente: "Pagamento pendente",
    pago: "Pagamento aprovado",
    cancelado: "Pagamento cancelado",
    estornado: "Pagamento estornado",
  }[status] || status || "Pagamento pendente";
}

function OrderSuccess() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [pagando, setPagando] = useState(false);
  const [simulacao, setSimulacao] = useState(false);

  const carregarPedido = useCallback(async () => {
    try {
      const response = await api.get(`/pedidos/${id}`);
      setPedido(response.data);
      const integracoes = await api.get("/integracoes/status");
      setSimulacao(Boolean(integracoes.data.simulacao));
    } catch (error) {
      setFeedback({ type: "error", text: error.response?.data?.erro || "Erro ao carregar pedido." });
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function iniciarPagamento() {
    if (pagando) return;
    try {
      setPagando(true);
      setFeedback({ type: "", text: "" });
      const response = await api.post(`/pedidos/${id}/pagamento`);
      window.location.assign(response.data.checkoutUrl);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || error.response?.data?.detalhe || "Erro ao iniciar pagamento.",
      });
      setPagando(false);
    }
  }

  useInitialLoad(carregarPedido);

  // O redirecionamento do checkout pode ocorrer antes da chegada do webhook.
  useEffect(() => {
    if (!pedido || pedido.statusPagamento === "pago" || pedido.status === "cancelado") return;
    const timer = setInterval(() => {
      api.get(`/pedidos/${id}`).then(r => setPedido(r.data)).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [id, pedido]);

  async function simularPagamento() {
    if (pagando) return;
    setPagando(true);
    try {
      await api.patch(`/pedidos/${id}/simular-pagamento`);
      await carregarPedido();
    } catch (error) { setFeedback({ type: "error", text: error.response?.data?.erro || "Erro na simulação" }); }
    finally { setPagando(false); }
  }

  if (loading) {
    return <main  className="py-10 sm:py-14"><div  className="mx-auto w-full max-w-7xl px-5 sm:px-8"><p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando pedido...</p></div></main>;
  }

  if (!pedido) {
    return (
      <main  className="py-10 sm:py-14"><div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {feedback.text && <StatusMessage type={feedback.type}>{feedback.text}</StatusMessage>}
        <Link to="/livros" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-transparent bg-accent text-[#1e293b] hover:bg-accent-hover">Voltar ao catálogo</Link>
      </div></main>
    );
  }

  const pagamentoPago = pedido.statusPagamento === "pago";
  const precisaPagamento = !pagamentoPago && pedido.status !== "cancelado" && Number(pedido.valor) > 0;

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <section  className="mb-8 flex flex-wrap items-start justify-between gap-6 [&_h1]:font-display [&_h1]:text-4xl [&_p]:mt-3 [&_p]:text-sm [&_p]:text-muted">
          <div>
            <span  className="mb-3 block text-xs uppercase tracking-[0.16em] text-muted">Pedido registrado</span>
            <h1  className="font-display text-4xl leading-tight sm:text-5xl">Pedido #{pedido.id}</h1>
            <p>Confira os dados do pedido e finalize o pagamento pelo gateway seguro.</p>
          </div>
          <div  className="grid gap-1 border-l-2 border-accent bg-soft p-4 text-sm">
            <span>Status de pagamento</span>
            <strong>{traduzirPagamento(pedido.statusPagamento)}</strong>
          </div>
        </section>

        {feedback.text && <StatusMessage type={feedback.type}>{feedback.text}</StatusMessage>}

        <section  className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
          <article  className="grid min-w-0 gap-5 border-t border-stroke pt-6 [&_h2]:font-display [&_h2]:text-2xl [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted">
            <h2  className="font-display text-2xl leading-snug">Resumo do pedido</h2>
            <div  className="grid gap-4 [&>div]:grid [&>div]:grid-cols-[1fr_1.4fr] [&>div]:gap-4 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:text-sm [&_strong]:font-medium">
              <div><span>Tipo</span><strong>{traduzirTipo(pedido.tipo)}</strong></div>
              <div><span>Livro</span><strong>{pedido.livro?.titulo}</strong></div>
              <div><span>Autor</span><strong>{pedido.livro?.autor}</strong></div>
              <div><span>Valor total</span><strong>{formatarMoeda(pedido.valor)}</strong></div>
              <div><span>Status do pedido</span><strong>{pedido.status}</strong></div>
              <div><span>Pagamento</span><strong>{traduzirPagamento(pedido.statusPagamento)}</strong></div>
              <div><span>Data do pedido</span><strong>{formatarData(pedido.createdAt)}</strong></div>
              <div><span>Retirada</span><strong>{formatarData(pedido.retiradaLimite)}</strong></div>

              {pedido.tipo === "aluguel" && (
                <>
                  <div><span>Dias de aluguel</span><strong>{pedido.diasAluguel} dias</strong></div>
                  <div><span>Devolução prevista</span><strong>{formatarData(pedido.devolucaoPrevista)}</strong></div>
                </>
              )}

              {pedido.modalidadeEntrega === "entrega" && (
                <>
                  <div><span>Modalidade</span><strong>Entrega</strong></div>
                  <div><span>Frete</span><strong>{formatarMoeda(pedido.valorEntrega)}</strong></div>
                  <div><span>Distância</span><strong>{pedido.distanciaEntregaKm || 0} km</strong></div>
                  <div><span>Status da entrega</span><strong>{pedido.statusEntrega?.replaceAll("_", " ")}</strong></div>
                </>
              )}
            </div>

            {pedido.modalidadeEntrega === "entrega" && (
              <div  className="grid gap-2 border-t border-stroke pt-5 text-sm [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:font-medium">
                <span>Endereço de entrega</span>
                <strong>{pedido.enderecoEntrega}</strong>
              </div>
            )}
          </article>

          <article  className="grid min-w-0 gap-5 border-t border-stroke pt-6 [&_h2]:font-display [&_h2]:text-2xl [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted lg:border-l lg:border-stroke lg:pl-8">
            <h2  className="font-display text-2xl leading-snug">Pagamento</h2>
            <p>
              O BiblioConnect abre o checkout do Mercado Pago. Os meios disponíveis na sua conta do gateway podem incluir cartão e Pix.
              Dados sensíveis de cartão não passam pelo servidor da biblioteca.
            </p>

            {simulacao && precisaPagamento && <Button disabled={pagando} onClick={simularPagamento} type="button" variant="secondary">Simular pagamento (demonstração)</Button>}

            {precisaPagamento ? (
              <Button onClick={iniciarPagamento} disabled={pagando} type="button" variant="primary">
                {pagando ? "Abrindo pagamento..." : "Pagar com cartão ou Pix"}
              </Button>
            ) : pagamentoPago ? (
              <div  className="grid gap-2 border-l-2 border-accent bg-soft p-4 text-sm"><strong>Pagamento aprovado</strong><span>O pagamento deste pedido está registrado.</span></div>
            ) : (
              <div  className="grid gap-2 border-l-2 border-accent bg-soft p-4 text-sm"><strong>Sem cobrança agora</strong><span>Este pedido não possui valor pendente para pagamento.</span></div>
            )}

            <div  className="mt-3 flex flex-wrap gap-3">
              <Link to={`/comprovante/${pedido.id}`} className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-transparent bg-accent text-[#1e293b] hover:bg-accent-hover">Ver comprovante</Link>
              <Link to="/meus-pedidos" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">Ver meus pedidos</Link>
              <Link to="/livros" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">Voltar ao catálogo</Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

export default OrderSuccess;
