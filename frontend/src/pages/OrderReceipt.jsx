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

  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarDataHora(data) {
  if (!data) return "Não informado";

  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function traduzirTipo(tipo) {
  const tipos = {
    compra: "Compra",
    reserva: "Reserva",
    aluguel: "Aluguel",
  };

  return tipos[tipo] || tipo;
}

function traduzirStatusPedido(status) {
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

function gerarCodigoComprovante(pedido) {
  if (!pedido) return "";

  const ano = new Date(pedido.createdAt).getFullYear();
  return `BC-${ano}-${String(pedido.id).padStart(6, "0")}`;
}

function limparNomeArquivo(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function OrderReceipt() {
  const { id } = useParams();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const carregarPedido = useCallback(async () => {
    try {

      const response = await api.get(`/pedidos/${id}`);

      setPedido(response.data);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao carregar comprovante.",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const definirTituloComprovante = useCallback(() => {
    if (!pedido) return;

    const nomeLivro = limparNomeArquivo(pedido.livro?.titulo || "Pedido");
    const tipoPedido = traduzirTipo(pedido.tipo);
    const numeroPedido = String(pedido.id).padStart(4, "0");

    document.title = `Comprovante - ${tipoPedido} - ${nomeLivro} - Pedido ${numeroPedido}`;
  }, [pedido]);

  function imprimirComprovante() {
    definirTituloComprovante();

    setTimeout(() => {
      window.print();
    }, 100);
  }

  useInitialLoad(carregarPedido);

  useEffect(() => {
    if (pedido) {
      definirTituloComprovante();
    }

    return () => {
      document.title = "BiblioConnect";
    };
  }, [pedido, definirTituloComprovante]);

  if (loading) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando comprovante...</p>
        </div>
      </main>
    );
  }

  if (!pedido) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          {feedback.text && (
            <StatusMessage type={feedback.type}>
              {feedback.text}
            </StatusMessage>
          )}

          <Link to="/meus-pedidos" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-transparent bg-accent text-[#1e293b] hover:bg-accent-hover">
            Voltar para meus pedidos
          </Link>
        </div>
      </main>
    );
  }

  const codigoComprovante = gerarCodigoComprovante(pedido);
  const pagamentoPago = pedido.statusPagamento === "pago";

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <section  className="mb-8 flex flex-wrap items-start justify-between gap-6 [&_h1]:font-display [&_h1]:text-4xl [&_p]:mt-3 [&_p]:max-w-xl [&_p]:text-sm [&_p]:text-muted print:hidden">
          <div>
            <span  className="mb-3 block text-xs uppercase tracking-[0.16em] text-muted">Comprovante</span>

            <h1  className="font-display text-4xl leading-tight sm:text-5xl">Comprovante do pedido</h1>

            <p>
              Documento de registro interno da operação realizada no
              BiblioConnect.
            </p>
          </div>

          <div  className="flex flex-wrap gap-2">
            <Button onClick={imprimirComprovante} type="button" variant="primary">
              Imprimir / Salvar PDF
            </Button>

            <Link to="/meus-pedidos" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">
              Meus pedidos
            </Link>

            <Link to="/livros" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">
              Catálogo
            </Link>
          </div>
        </section>

        {feedback.text && (
          <StatusMessage type={feedback.type}>
            {feedback.text}
          </StatusMessage>
        )}

        <section  className="receipt-print mx-auto max-w-4xl border border-stroke bg-surface p-5 sm:p-10 print:border-0 print:p-0">
          <header  className="flex flex-wrap items-start justify-between gap-5 border-b border-stroke pb-6">
            <div  className="flex items-center gap-3 [&_h2]:font-display [&_h2]:text-2xl [&_span]:text-xs [&_span]:text-muted">
              <div  className="grid h-11 w-11 place-items-center bg-brand text-white">BC</div>

              <div>
                <h2  className="font-display text-2xl leading-snug">BiblioConnect</h2>
                <span>Biblioteca Online</span>
              </div>
            </div>

            <div  className="grid gap-1 text-sm [&_span]:text-xs [&_span]:text-muted">
              <span>Código do comprovante</span>
              <strong>{codigoComprovante}</strong>
            </div>
          </header>

          <section  className="my-6 grid gap-3 sm:grid-cols-3">
            <div className={`grid gap-1 border-l-2 pl-3 text-sm [&_span]:text-xs [&_span]:text-muted ${pagamentoPago ? "border-green-700" : "border-accent"}`}>
              <span>Status de pagamento</span>
              <strong>{traduzirPagamento(pedido.statusPagamento)}</strong>
            </div>

            <div  className="grid gap-1 border-l-2 border-stroke pl-3 text-sm [&_span]:text-xs [&_span]:text-muted">
              <span>Status do pedido</span>
              <strong>{traduzirStatusPedido(pedido.status)}</strong>
            </div>

            <div  className="grid gap-1 border-l-2 border-stroke pl-3 text-sm [&_span]:text-xs [&_span]:text-muted">
              <span>Tipo de operação</span>
              <strong>{traduzirTipo(pedido.tipo)}</strong>
            </div>
          </section>

          <section  className="border-t border-stroke py-6">
            <div  className="mb-5 flex items-center gap-3 [&_h3]:font-display [&_h3]:text-xl">
              <span>01</span>
              <h3>Dados do cliente</h3>
            </div>

            <div  className="grid gap-5 sm:grid-cols-2 [&>div]:grid [&>div]:gap-1 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:text-sm [&_strong]:font-medium">
              <div>
                <span>Nome</span>
                <strong>{pedido.usuario?.nome || "Não informado"}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{pedido.usuario?.email || "Não informado"}</strong>
              </div>

              <div>
                <span>Telefone</span>
                <strong>{pedido.usuario?.telefone || "Não informado"}</strong>
              </div>

              <div>
                <span>Endereço</span>
                <strong>{pedido.usuario?.endereco || "Não informado"}</strong>
              </div>
            </div>
          </section>

          <section  className="border-t border-stroke py-6">
            <div  className="mb-5 flex items-center gap-3 [&_h3]:font-display [&_h3]:text-xl">
              <span>02</span>
              <h3>Dados do livro</h3>
            </div>

            <div  className="grid gap-5 sm:grid-cols-2 [&>div]:grid [&>div]:gap-1 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:text-sm [&_strong]:font-medium">
              <div>
                <span>Título</span>
                <strong>{pedido.livro?.titulo || "Não informado"}</strong>
              </div>

              <div>
                <span>Autor</span>
                <strong>{pedido.livro?.autor || "Não informado"}</strong>
              </div>

              <div>
                <span>Categoria</span>
                <strong>{pedido.livro?.categoria || "Não informado"}</strong>
              </div>

              <div>
                <span>Valor do pedido</span>
                <strong>{formatarMoeda(pedido.valor)}</strong>
              </div>
            </div>
          </section>

          <section  className="border-t border-stroke py-6">
            <div  className="mb-5 flex items-center gap-3 [&_h3]:font-display [&_h3]:text-xl">
              <span>03</span>
              <h3>Detalhes da operação</h3>
            </div>

            <div  className="grid gap-5 sm:grid-cols-2 [&>div]:grid [&>div]:gap-1 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:text-sm [&_strong]:font-medium">
              <div>
                <span>Número do pedido</span>
                <strong>#{pedido.id}</strong>
              </div>

              <div>
                <span>Data do pedido</span>
                <strong>{formatarDataHora(pedido.createdAt)}</strong>
              </div>

              <div>
                <span>Retirada limite</span>
                <strong>{formatarData(pedido.retiradaLimite)}</strong>
              </div>

              <div>
                <span>Pagamento</span>
                <strong>{traduzirPagamento(pedido.statusPagamento)}</strong>
              </div>

              {pedido.tipo === "aluguel" && (
                <>
                  <div>
                    <span>Dias de aluguel</span>
                    <strong>{pedido.diasAluguel} dias</strong>
                  </div>

                  <div>
                    <span>Devolução prevista</span>
                    <strong>{formatarData(pedido.devolucaoPrevista)}</strong>
                  </div>
                </>
              )}
            </div>
          </section>

          <section  className="my-5 border-y border-stroke bg-soft p-5 [&>div]:flex [&>div]:flex-wrap [&>div]:items-center [&>div]:justify-between [&_strong]:font-display [&_strong]:text-3xl [&_p]:mt-3 [&_p]:text-xs [&_p]:text-muted">
            <div>
              <span>Total do comprovante</span>
              <strong>{formatarMoeda(pedido.valor)}</strong>
            </div>

            <p>
              Este comprovante registra a movimentação realizada no sistema
              BiblioConnect. Para validade financeira plena, o status de
              pagamento deve constar como aprovado.
            </p>
          </section>

          <footer  className="flex flex-wrap justify-between gap-3 pt-5 text-xs text-muted">
            <span>Gerado em {formatarDataHora(new Date())}</span>
            <span>BiblioConnect • Sistema de Biblioteca Online</span>
          </footer>
        </section>
      </div>
    </main>
  );
}

export default OrderReceipt;
