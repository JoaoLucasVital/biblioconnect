import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import { BookOpen, ShoppingBag, Bookmark } from "lucide-react";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useMemo, useState } from "react";
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

function AdminOrders() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const [pedidoAcao, setPedidoAcao] = useState(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [processando, setProcessando] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  const carregarPedidos = useCallback(async () => {
    try {

      const response = await api.get("/admin/pedidos");

      setPedidos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao carregar pedidos.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  function abrirConfirmacao(pedido, status) {
    if (
      (status === "concluido" || status === "devolvido") &&
      pedido.statusPagamento !== "pago"
    ) {
      setFeedback({
        type: "error",
        text: "Este pedido ainda não possui pagamento aprovado. Marque o pagamento como pago no Financeiro antes de finalizar.",
      });

      return;
    }

    setPedidoAcao(pedido);
    setNovoStatus(status);
  }

  function fecharConfirmacao() {
    setPedidoAcao(null);
    setNovoStatus("");
  }

  async function confirmarStatus() {
    if (!pedidoAcao || !novoStatus || processando) return;

    try {
      setProcessando(true);
      setFeedback({ type: "", text: "" });

      await api.patch(`/admin/pedidos/${pedidoAcao.id}/status`, {
        status: novoStatus,
      });

      if (novoStatus === "cancelado") {
        setFeedback({
          type: "danger",
          text: "Pedido cancelado com sucesso.",
        });
      } else {
        setFeedback({
          type: "success",
          text: "Status do pedido atualizado com sucesso.",
        });
      }

      fecharConfirmacao();
      carregarPedidos();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao atualizar status.",
      });
    } finally {
      setProcessando(false);
    }
  }

  function limparFiltros() {
    setFiltroTipo("todos");
    setFiltroStatus("todos");
    setBusca("");
  }

  useInitialLoad(carregarPedidos);

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return pedidos.filter((pedido) => {
      const tipoValido = filtroTipo === "todos" || pedido.tipo === filtroTipo;

      const statusValido =
        filtroStatus === "todos" || pedido.status === filtroStatus;

      const textoBusca = [
        pedido.livro?.titulo,
        pedido.livro?.autor,
        pedido.usuario?.nome,
        pedido.usuario?.email,
        pedido.usuario?.telefone,
        pedido.statusPagamento,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const buscaValida = !termo || textoBusca.includes(termo);

      return tipoValido && statusValido && buscaValida;
    });
  }, [pedidos, filtroTipo, filtroStatus, busca]);

  const pendentes = pedidosFiltrados.filter(
    (pedido) => pedido.status === "pendente"
  );

  const finalizados = pedidosFiltrados.filter(
    (pedido) => pedido.status !== "pendente"
  );

  const totalMultas = pedidosFiltrados.reduce((total, pedido) => {
    return total + Number(pedido.multaAtual || 0);
  }, 0);

  const totalValor = pedidosFiltrados.reduce((total, pedido) => {
    return total + Number(pedido.valor || 0);
  }, 0);

  const grupos = [
    {
      titulo: "Pedidos pendentes",
      descricao: "Pedidos que ainda precisam de ação administrativa.",
      pedidos: pendentes,
    },
    {
      titulo: "Histórico finalizado",
      descricao: "Pedidos concluídos, devolvidos ou cancelados.",
      pedidos: finalizados,
    },
  ];

  if (loading) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando pedidos...</p>
        </div>
      </main>
    );
  }

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div  className="mb-8">
          <div>
            <h1  className="font-display text-4xl leading-tight sm:text-5xl">Gerenciar Pedidos</h1>

            <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
              Finalize apenas pedidos com pagamento aprovado. Pedidos pendentes
              continuam aguardando confirmação financeira.
            </p>
          </div>
        </div>

        {feedback.text && (
          <StatusMessage type={feedback.type}>{feedback.text}</StatusMessage>
        )}

        <section  className="my-5 border-l-2 border-accent pl-4 text-sm text-muted">
          <strong>Regra operacional ativa</strong>
          <p>
            Pedidos só podem ser concluídos ou devolvidos depois que o pagamento
            estiver aprovado no módulo Financeiro.
          </p>
        </section>

        <section  className="my-8 border-y border-stroke py-6">
          <div  className="mb-5 flex flex-wrap justify-between gap-4 [&_h2]:font-display [&_h2]:text-2xl [&_p]:text-sm [&_p]:text-muted">
            <div>
              <h2  className="font-display text-2xl leading-snug">Filtros</h2>
              <p>Encontre pedidos por tipo, status, cliente ou livro.</p>
            </div>

            <Button onClick={limparFiltros} type="button" variant="secondary">
              Limpar filtros
            </Button>
          </div>

          <div  className="grid items-end gap-4 md:grid-cols-3">
            <div className="grid gap-2"><Field label={"Buscar"}><input type="text" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Nome, email, telefone, livro ou pagamento" /></Field></div>

            <div className="grid gap-2"><Field label={"Tipo"}><select value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value)} >
                <option value="todos">Todos os tipos</option>
                <option value="compra">Compra</option>
                <option value="reserva">Reserva</option>
                <option value="aluguel">Aluguel</option>
              </select></Field></div>

            <div className="grid gap-2"><Field label={"Status"}><select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="concluido">Concluído</option>
                <option value="devolvido">Devolvido</option>
                <option value="cancelado">Cancelado</option>
              </select></Field></div>
          </div>
        </section>

        <section  className="my-8 grid grid-cols-2 gap-6 lg:grid-cols-4 [&>div]:grid [&>div]:gap-1 [&_span]:text-xs [&_span]:text-muted [&_strong]:font-display [&_strong]:text-2xl">
          <div>
            <span>Pedidos encontrados</span>
            <strong>{pedidosFiltrados.length}</strong>
          </div>

          <div>
            <span>Pendentes</span>
            <strong>{pendentes.length}</strong>
          </div>

          <div>
            <span>Valor filtrado</span>
            <strong>{formatarMoeda(totalValor)}</strong>
          </div>

          <div>
            <span>Multas filtradas</span>
            <strong>{formatarMoeda(totalMultas)}</strong>
          </div>
        </section>

        {pedidosFiltrados.length === 0 ? (
          <div  className="my-8 border-y border-stroke py-12 text-muted [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">
            <h2  className="font-display text-2xl leading-snug">Nenhum pedido encontrado</h2>
            <p>
              Ajuste os filtros ou aguarde clientes realizarem ações no
              catálogo.
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
                    {grupo.pedidos.map((pedido) => {
                      const pagamentoAprovado =
                        pedido.statusPagamento === "pago";

                      return (
                        <article key={pedido.id} className="min-w-0 border-t border-stroke py-6">
                          <div  className="flex min-w-0 items-start gap-4">
                            <div  className="shrink-0 text-2xl">
                              {pedido.tipo === "compra" && <ShoppingBag size={22} aria-hidden="true"/>}
                              {pedido.tipo === "reserva" && <Bookmark size={22} aria-hidden="true"/>}
                              {pedido.tipo === "aluguel" && <BookOpen size={22} aria-hidden="true"/>}
                            </div>

                            <div>
                              <div  className="flex flex-wrap items-center gap-2 [&_h2]:w-full [&_h2]:wrap-anywhere [&_h2]:font-display [&_h2]:text-2xl">
                                <h2  className="font-display text-2xl leading-snug">{pedido.livro?.titulo}</h2>

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
                                Cliente: <strong>{pedido.usuario?.nome}</strong>
                              </p>

                              <small>
                                Pedido feito em{" "}
                                {formatarData(pedido.createdAt)}
                              </small>
                            </div>
                          </div>

                          {!pagamentoAprovado &&
                            pedido.status === "pendente" && (
                              <div  className="my-3 border-l-2 border-accent pl-3 text-sm text-muted">
                                Pagamento ainda não aprovado. Finalização
                                bloqueada.
                              </div>
                            )}

                          <div  className="my-5 grid grid-cols-2 gap-4 lg:grid-cols-3 [&>div]:grid [&>div]:gap-1 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:text-sm">
                            <div>
                              <span>Email</span>
                              <strong>{pedido.usuario?.email}</strong>
                            </div>

                            <div>
                              <span>Telefone</span>
                              <strong>
                                {pedido.usuario?.telefone || "Não informado"}
                              </strong>
                            </div>

                            <div>
                              <span>Endereço</span>
                              <strong>
                                {pedido.usuario?.endereco || "Não informado"}
                              </strong>
                            </div>

                            <div>
                              <span>Valor</span>
                              <strong>{formatarMoeda(pedido.valor)}</strong>
                            </div>

                            <div>
                              <span>Pagamento</span>
                              <strong>
                                {traduzirPagamento(
                                  pedido.statusPagamento || "pendente"
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>Multa atual</span>
                              <strong>
                                {formatarMoeda(pedido.multaAtual)}
                              </strong>
                            </div>

                            <div>
                              <span>Retirada</span>
                              <strong>
                                {formatarData(pedido.retiradaLimite)}
                              </strong>
                            </div>

                            {pedido.tipo === "aluguel" && (
                              <div>
                                <span>Devolução prevista</span>
                                <strong>
                                  {formatarData(pedido.devolucaoPrevista)}
                                </strong>
                              </div>
                            )}

                            <div>
                              <span>Status</span>
                              <strong>{traduzirStatus(pedido.status)}</strong>
                            </div>
                          </div>

                          {pedido.status === "pendente" && (
                            <div  className="flex flex-wrap gap-2">
                              {pedido.tipo === "aluguel" ? (
                                <Button onClick={() =>
                                    abrirConfirmacao(pedido, "devolvido")
                                  } disabled={!pagamentoAprovado} type="button" variant="primary">
                                  Marcar devolvido
                                </Button>
                              ) : (
                                <Button onClick={() =>
                                    abrirConfirmacao(pedido, "concluido")
                                  } disabled={!pagamentoAprovado} type="button" variant="primary">
                                  Marcar concluído
                                </Button>
                              )}

                              <Button onClick={() =>
                                  abrirConfirmacao(pedido, "cancelado")
                                } type="button" variant="danger">
                                Cancelar pedido
                              </Button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {pedidoAcao && (
        <Dialog open title={<>Atualizar pedido</>} onClose={fecharConfirmacao} busy={processando} footer={<div  className="flex flex-wrap justify-end gap-3">
              <Button onClick={fecharConfirmacao} disabled={processando} type="button" variant="secondary">
                Voltar
              </Button>

              <Button onClick={confirmarStatus} disabled={processando} type="button" variant={novoStatus==="cancelado" ? "danger" : "primary"}>
                {processando ? "Atualizando..." : "Confirmar"}
              </Button>
            </div>}>
            

            <p>
              Confirmar alteração do pedido de{" "}
              <strong>{traduzirTipo(pedidoAcao.tipo)}</strong> para{" "}
              <strong>{traduzirStatus(novoStatus)}</strong>?
            </p>

            <div  className="grid gap-2 text-sm text-muted">
              <span>Livro: {pedidoAcao.livro?.titulo}</span>
              <span>Cliente: {pedidoAcao.usuario?.nome}</span>
              <span>Valor: {formatarMoeda(pedidoAcao.valor)}</span>
              <span>
                Pagamento:{" "}
                {traduzirPagamento(pedidoAcao.statusPagamento || "pendente")}
              </span>
              <span>Multa atual: {formatarMoeda(pedidoAcao.multaAtual)}</span>
            </div>

            
          {feedback.type==="error" && feedback.text && <StatusMessage type="error">{feedback.text}</StatusMessage>}</Dialog>
      )}
    </main>
  );
}

export default AdminOrders;
