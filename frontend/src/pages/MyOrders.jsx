import StatusMessage from "../components/ui/StatusMessage.jsx";
import OrderCard from "../features/orders/OrderCard.jsx";
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
      descricao: "Livros comprados, com entrega ou retirada.",
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
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-stroke pb-7"><div><p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">ÁREA DO LEITOR / PEDIDOS</p><h1 className="font-display text-4xl leading-tight sm:text-5xl">Meus Pedidos</h1></div><Link to="/livros#catalogo" className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Encontrar minha próxima leitura ↗</Link></header>

        <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
          Compras, reservas e aluguéis, com os próximos passos de cada leitura.
        </p>

        {feedback.text && (
          <StatusMessage type={feedback.type}>{feedback.text}</StatusMessage>
        )}

        <nav aria-label="Categorias de pedidos" className="my-8 grid grid-cols-3 divide-x divide-stroke overflow-hidden rounded-lg border border-stroke bg-soft">{grupos.map(grupo=><a key={grupo.titulo} href={grupo.pedidos.length ? `#pedidos-${grupo.titulo}` : undefined} aria-disabled={!grupo.pedidos.length || undefined} className="min-w-0 px-4 py-5 transition-colors hover:bg-surface sm:px-6"><span className="block text-[10px] uppercase tracking-[0.1em] text-muted sm:text-xs">{grupo.titulo}</span><strong className="mt-2 block font-display text-3xl sm:text-4xl">{grupo.pedidos.length}</strong></a>)}</nav>
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
            {grupos.filter(grupo=>grupo.pedidos.length>0).map((grupo) => (
              <section key={grupo.titulo} className="min-w-0 scroll-mt-28" id={`pedidos-${grupo.titulo}`}>
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
                    {grupo.pedidos.map(pedido=><OrderCard key={pedido.id} pedido={pedido} busy={processandoAcao} onPagar={iniciarPagamento} onEstender={item=>{setPedidoExtensao(item);setDiasExtras("7");}} onCancelar={setPedidoCancelamento}/>)}
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
