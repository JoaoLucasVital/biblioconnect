import StatusMessage from "../components/ui/StatusMessage.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
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
    reserva: "Reserva",
    compra: "Compra",
    aluguel: "Aluguel",
  };

  return tipos[tipo] || tipo;
}

function traduzirStatus(status) {
  const statusMap = {
    pendente: "Pendente",
    concluido: "Concluído",
    devolvido: "Devolvido",
    cancelado: "Cancelado",
  };

  return statusMap[status] || status;
}

function traduzirPagamento(status) {
  const statusMap = {
    pendente: "Pagamento pendente",
    pago: "Pagamento aprovado",
    cancelado: "Pagamento cancelado",
    estornado: "Pagamento estornado",
  };

  return statusMap[status] || status || "Pagamento pendente";
}

function getPedidoIcon(tipo) {
  if (tipo === "compra") return "💰";
  if (tipo === "reserva") return "📌";
  if (tipo === "aluguel") return "📖";
  return "📚";
}

function MyOrders() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [pedidoCancelamento, setPedidoCancelamento] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [pedidoExtensao, setPedidoExtensao] = useState(null);
  const [diasExtras, setDiasExtras] = useState("7");
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const carregarPedidos = useCallback(async () => {
    try {

      const response = await api.get("/me/pedidos");

      setPedidos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      const mensagemBackend =
        error.response?.data?.detalhe ||
        error.response?.data?.erro ||
        error.message ||
        "Erro ao carregar seus pedidos.";

      setFeedback({ type: "error", text: mensagemBackend });
    } finally {
      setLoading(false);
    }
  }, []);

  async function confirmarCancelamento() {
    if (!pedidoCancelamento || cancelando) return;

    try {
      setCancelando(true);

      await api.patch(`/me/pedidos/${pedidoCancelamento.id}/cancelar`);

      setFeedback({
        type: "danger",
        text: "Pedido cancelado com sucesso.",
      });

      setPedidoCancelamento(null);
      carregarPedidos();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao cancelar pedido.",
      });
    } finally {
      setCancelando(false);
    }
  }

  async function iniciarPagamento(pedido) {
    if (processandoAcao) return;
    try {
      setProcessandoAcao(true);
      const response = await api.post(`/pedidos/${pedido.id}/pagamento`);
      window.location.assign(response.data.checkoutUrl);
    } catch (error) {
      setFeedback({ type: "error", text: error.response?.data?.erro || "Erro ao iniciar pagamento." });
      setProcessandoAcao(false);
    }
  }

  async function confirmarExtensao() {
    if (!pedidoExtensao || processandoAcao) return;
    try {
      setProcessandoAcao(true);
      const response = await api.post(`/me/pedidos/${pedidoExtensao.id}/estender-aluguel`, {
        diasExtras: Number(diasExtras),
      });
      if (response.data.checkoutUrl) window.location.assign(response.data.checkoutUrl);
      else {
        setPedidoExtensao(null);
        await carregarPedidos();
        setFeedback({ type: "success", text: response.data.mensagem });
        setProcessandoAcao(false);
      }
    } catch (error) {
      setFeedback({ type: "error", text: error.response?.data?.erro || "Erro ao solicitar extensão." });
      setProcessandoAcao(false);
    }
  }

  useInitialLoad(carregarPedidos);

  const reservas = pedidos.filter((pedido) => pedido.tipo === "reserva");
  const compras = pedidos.filter((pedido) => pedido.tipo === "compra");
  const alugueis = pedidos.filter((pedido) => pedido.tipo === "aluguel");

  const grupos = [
    {
      titulo: "Reservas",
      descricao: "Livros reservados para retirada na biblioteca.",
      pedidos: reservas,
    },
    {
      titulo: "Compras",
      descricao: "Livros comprados e aguardando retirada.",
      pedidos: compras,
    },
    {
      titulo: "Aluguéis",
      descricao: "Livros alugados com prazo de devolução.",
      pedidos: alugueis,
    },
  ];

  if (loading) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando seus pedidos...</p>
        </div>
      </main>
    );
  }

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <h1  className="font-display text-4xl leading-tight sm:text-5xl">Meus Pedidos</h1>

        <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
          Acompanhe separadamente suas reservas, compras e aluguéis.
        </p>

        {feedback.text && (
          <StatusMessage type={feedback.type}>{feedback.text}</StatusMessage>
        )}

        {pedidos.length === 0 ? (
          <div  className="my-8 border-y border-stroke py-12 text-muted [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">
            <h2  className="font-display text-2xl leading-snug">Nenhum pedido encontrado</h2>
            <p>
              Quando você reservar, comprar ou alugar um livro, o pedido
              aparecerá aqui.
            </p>
          </div>
        ) : (
          <div  className="mt-10 grid gap-10">
            {grupos.map((grupo) => (
              <section key={grupo.titulo} className="min-w-0">
                <div  className="mb-5 flex items-center justify-between gap-3 [&_h2]:font-display [&_h2]:text-2xl [&_p]:text-sm [&_p]:text-muted">
                  <div>
                    <h2  className="font-display text-2xl leading-snug">{grupo.titulo}</h2>
                    <p>{grupo.descricao}</p>
                  </div>

                  <span>{grupo.pedidos.length}</span>
                </div>

                {grupo.pedidos.length === 0 ? (
                  <div  className="border-t border-stroke py-6 text-sm text-muted">
                    Nenhum pedido nesta categoria.
                  </div>
                ) : (
                  <div  className="grid gap-6">
                    {grupo.pedidos.map((pedido) => (
                      <div key={pedido.id} className="min-w-0 border border-stroke bg-surface p-5 sm:p-7">
                        <div  className="flex min-w-0 items-start gap-4">
                          <div  className="shrink-0 text-2xl">
                            {getPedidoIcon(pedido.tipo)}
                          </div>

                          <div>
                            <div  className="flex flex-wrap items-center gap-2 [&_h2]:w-full [&_h2]:wrap-anywhere [&_h2]:font-display [&_h2]:text-2xl">
                              <h2  className="font-display text-2xl leading-snug">
                                {pedido.livro?.titulo ||
                                  "Livro não encontrado"}
                              </h2>

                              <StatusBadge>
                                {traduzirTipo(pedido.tipo)}
                              </StatusBadge>

                              <StatusBadge>
                                {traduzirStatus(pedido.status)}
                              </StatusBadge>

                              <StatusBadge>
                                {traduzirPagamento(
                                  pedido.statusPagamento || "pendente"
                                )}
                              </StatusBadge>
                            </div>

                            <p>
                              {pedido.livro?.autor || "Autor não informado"}
                            </p>

                            <small>
                              Data do pedido: {formatarData(pedido.createdAt)}
                            </small>
                          </div>
                        </div>

                        <div  className="my-6 grid grid-cols-2 gap-5 border-y border-stroke py-5 sm:grid-cols-3 [&_div]:grid [&_div]:gap-1 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:text-sm [&_strong]:font-medium">
                          <div>
                            <span>Tipo</span>
                            <strong>{traduzirTipo(pedido.tipo)}</strong>
                          </div>

                          <div>
                            <span>Valor</span>
                            <strong>{formatarMoeda(pedido.valor)}</strong>
                          </div>

                          <div>
                            <span>Retirada</span>
                            <strong>{formatarData(pedido.retiradaLimite)}</strong>
                          </div>

                          <div>
                            <span>Pagamento</span>
                            <strong>
                              {traduzirPagamento(
                                pedido.statusPagamento || "pendente"
                              )}
                            </strong>
                          </div>

                          {pedido.modalidadeEntrega === "entrega" && (
                            <>
                              <div>
                                <span>Entrega</span>
                                <strong>{pedido.statusEntrega?.replaceAll("_", " ")}</strong>
                              </div>
                              <div>
                                <span>Frete</span>
                                <strong>{formatarMoeda(pedido.valorEntrega)}</strong>
                              </div>
                            </>
                          )}

                          {pedido.tipo === "aluguel" && (
                            <>
                              <div>
                                <span>Dias de aluguel</span>
                                <strong>{pedido.diasAluguel} dias</strong>
                              </div>

                              <div>
                                <span>Devolução</span>
                                <strong>
                                  {formatarData(pedido.devolucaoPrevista)}
                                </strong>
                              </div>
                            </>
                          )}
                        </div>

                        <div  className="flex flex-wrap gap-2">
                          <Link to={`/pedido-confirmado/${pedido.id}`} className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">Detalhes e pagamento</Link>
                          <Link to={`/comprovante/${pedido.id}`} className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">
                            Comprovante
                          </Link>

                          {pedido.statusPagamento !== "pago" && pedido.status !== "cancelado" && Number(pedido.valor) > 0 && (
                            <Button disabled={processandoAcao} onClick={() => iniciarPagamento(pedido)} type="button" variant="primary">
                              Pagar pedido
                            </Button>
                          )}

                          {pedido.tipo === "aluguel" && pedido.statusPagamento === "pago" && pedido.status === "pendente" && (
                            <Button onClick={() => { setPedidoExtensao(pedido); setDiasExtras("7"); }} type="button" variant="secondary">
                              Estender aluguel
                            </Button>
                          )}

                          {pedido.status !== "cancelado" && (
                            <Link to={`/livros/${pedido.livroId}/avaliacoes`} className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">
                              Avaliar livro
                            </Link>
                          )}

                          {pedido.status === "pendente" && !(pedido.statusPagamento === "pago" && Number(pedido.valor || 0) > 0) && (
                            <Button onClick={() => setPedidoCancelamento(pedido)} type="button" variant="danger">
                              Cancelar pedido
                            </Button>
                          )}

                          {pedido.statusPagamento === "pago" && Number(pedido.valor || 0) > 0 && pedido.status !== "cancelado" && (
                            <Link to="/chat" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">
                              Pedir cancelamento/estorno
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {pedidoExtensao && (
        <Dialog open title={"Estender aluguel"} onClose={() => setPedidoExtensao(null)} busy={processandoAcao} footer={<div  className="flex flex-wrap justify-end gap-3">
              <Button onClick={() => setPedidoExtensao(null)} disabled={processandoAcao} type="button" variant="secondary">Cancelar</Button>
              <Button onClick={confirmarExtensao} disabled={processandoAcao} type="button" variant="primary">
                {processandoAcao ? "Abrindo pagamento..." : "Continuar para pagamento"}
              </Button>
            </div>}>
            
            <p>Escolha quantos dias deseja adicionar ao aluguel de <strong>{pedidoExtensao.livro?.titulo}</strong>.</p>
            <div className="grid gap-2"><Field label={"Dias extras"}><input type="number" min="1" max="30" value={diasExtras} onChange={(event) => setDiasExtras(event.target.value)}/></Field></div>
            <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
              Valor estimado: {formatarMoeda(Number(diasExtras || 0) * Number(pedidoExtensao.livro?.precoDiaExtra || 0))}.
              O novo prazo só será aplicado depois que o pagamento for aprovado.
            </p>
            
          {feedback.type==="error" && feedback.text && <StatusMessage type="error">{feedback.text}</StatusMessage>}</Dialog>
      )}

      {pedidoCancelamento && (
        <Dialog open title={"Cancelar pedido"} onClose={() => setPedidoCancelamento(null)} busy={cancelando} footer={<div  className="flex flex-wrap justify-end gap-3">
              <Button onClick={() => setPedidoCancelamento(null)} disabled={cancelando} type="button" variant="secondary">
                Voltar
              </Button>

              <Button onClick={confirmarCancelamento} disabled={cancelando} type="button" variant="danger">
                {cancelando ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
            </div>}>
            

            <p>
              Tem certeza que deseja cancelar este pedido de{" "}
              <strong>{traduzirTipo(pedidoCancelamento.tipo)}</strong>?
            </p>

            <div  className="grid gap-2 text-sm text-muted">
              <span>Livro: {pedidoCancelamento.livro?.titulo}</span>
              <span>Valor: {formatarMoeda(pedidoCancelamento.valor)}</span>
              <span>
                Data do pedido: {formatarData(pedidoCancelamento.createdAt)}
              </span>
            </div>

            
          {feedback.type==="error" && feedback.text && <StatusMessage type="error">{feedback.text}</StatusMessage>}</Dialog>
      )}
    </main>
  );
}

export default MyOrders;
