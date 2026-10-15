import {AnimatedHeading} from '../components/motion/TextAnimations.jsx';
import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useState } from "react";
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

function AdminDelays() {
  const [atrasos, setAtrasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const [processandoId, setProcessandoId] = useState(null);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState(null);

  const carregarAtrasos = useCallback(async () => {
    try {

      const response = await api.get("/admin/atrasos");
      setAtrasos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao carregar atrasos.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  function abrirConfirmacao(atraso, tipoAcao) {
    setAcaoConfirmacao({ atraso, tipoAcao });
  }

  function fecharConfirmacao() {
    setAcaoConfirmacao(null);
  }

  async function confirmarAcao() {
    if (!acaoConfirmacao || processandoId !== null) return;

    const { atraso, tipoAcao } = acaoConfirmacao;

    try {
      setProcessandoId(atraso.id);
      setFeedback({ type: "", text: "" });

      if (tipoAcao === "congelar") {
        await api.patch(`/admin/usuarios/${atraso.usuario.id}/bloqueio`, {
          bloqueado: true,
        });

        setFeedback({
          type: "danger",
          text: `Usuário ${atraso.usuario.nome} congelado com sucesso.`,
        });
      }

      if (tipoAcao === "resolver") {
        const novoStatus = atraso.tipo === "aluguel" ? "devolvido" : "concluido";

        await api.patch(`/admin/pedidos/${atraso.id}/status`, {
          status: novoStatus,
        });

        setFeedback({
          type: "success",
          text: "Pendência resolvida com sucesso.",
        });
      }

      fecharConfirmacao();
      carregarAtrasos();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao executar ação.",
      });
    } finally {
      setProcessandoId(null);
    }
  }

  useInitialLoad(carregarAtrasos);

  const totalMultas = atrasos.reduce((total, item) => {
    return total + Number(item.multa || 0);
  }, 0);

  if (loading) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando atrasos...</p>
        </div>
      </main>
    );
  }

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div  className="mb-8">
          <div>
            <AnimatedHeading  className="font-display text-4xl leading-tight sm:text-5xl">Atrasos e Multas</AnimatedHeading>
            <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
              Acompanhe reservas e aluguéis atrasados, calcule multas e resolva pendências.
            </p>
          </div>
        </div>

        {feedback.text && (
          <StatusMessage type={feedback.type}>{feedback.text}</StatusMessage>
        )}

        <section  className="my-7 grid grid-cols-2 gap-6 [&>div]:grid [&>div]:gap-2 [&_span]:text-xs [&_span]:text-muted [&_strong]:font-display [&_strong]:text-3xl">
          <div>
            <span>Total de atrasos</span>
            <strong>{atrasos.length}</strong>
          </div>

          <div>
            <span>Multas pendentes</span>
            <strong>{formatarMoeda(totalMultas)}</strong>
          </div>
        </section>

        {atrasos.length === 0 ? (
          <div  className="my-8 border-y border-stroke py-12 text-muted [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">
            <h2  className="font-display text-2xl leading-snug">Nenhum atraso no momento</h2>
            <p>
              Quando houver reservas ou aluguéis atrasados, eles aparecerão nesta área.
            </p>
          </div>
        ) : (
          <div  className="grid gap-7">
            {atrasos.map((atraso) => (
              <article key={atraso.id} className="min-w-0 border-t border-stroke py-6">
                <div  className="min-w-0">
                  <div  className="mb-5 flex flex-wrap justify-between gap-4 [&_h2]:font-display [&_h2]:text-2xl [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
                    <div>
                      <h2  className="font-display text-2xl leading-snug">{atraso.livro.titulo}</h2>

                      <p>
                        {traduzirTipo(atraso.tipo)} de{" "}
                        <strong>{atraso.usuario.nome}</strong>
                      </p>
                    </div>

                    <span  className="font-display text-2xl text-red-700 dark:text-red-300">{formatarMoeda(atraso.multa)}</span>
                  </div>

                  <div  className="grid grid-cols-2 gap-5 lg:grid-cols-3 [&>div]:grid [&>div]:gap-1 [&_span]:text-xs [&_span]:text-muted [&_strong]:wrap-anywhere [&_strong]:text-sm">
                    <div>
                      <span>Usuário</span>
                      <strong>{atraso.usuario.nome}</strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>{atraso.usuario.email}</strong>
                    </div>

                    <div>
                      <span>Telefone</span>
                      <strong>{atraso.usuario.telefone || "Não informado"}</strong>
                    </div>

                    <div>
                      <span>Endereço</span>
                      <strong>{atraso.usuario.endereco || "Não informado"}</strong>
                    </div>

                    <div>
                      <span>Tipo</span>
                      <strong>{traduzirTipo(atraso.tipo)}</strong>
                    </div>

                    <div>
                      <span>Data limite</span>
                      <strong>{formatarData(atraso.dataReferencia)}</strong>
                    </div>

                    <div>
                      <span>Dias de atraso</span>
                      <strong>{atraso.diasAtraso} dias</strong>
                    </div>

                    <div>
                      <span>Multa</span>
                      <strong>{formatarMoeda(atraso.multa)}</strong>
                    </div>

                    <div>
                      <span>Status do usuário</span>
                      <strong>{atraso.usuario.bloqueado ? "Congelado" : "Ativo"}</strong>
                    </div>

                    <div>
                      <span>Preço por dia extra</span>
                      <strong>{formatarMoeda(atraso.livro.precoDiaExtra || 2)}</strong>
                    </div>
                  </div>

                  <div  className="mt-6 flex flex-wrap gap-2">
                    {!atraso.usuario.bloqueado && (
                      <Button onClick={() => abrirConfirmacao(atraso, "congelar")} disabled={processandoId === atraso.id} type="button" variant="danger">
                        Congelar usuário
                      </Button>
                    )}

                    <Button onClick={() => abrirConfirmacao(atraso, "resolver")} disabled={processandoId === atraso.id} type="button" variant="primary">
                      Resolver pendência
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {acaoConfirmacao && (
        <Dialog open title={<>
              {acaoConfirmacao.tipoAcao === "congelar"
                ? "Congelar usuário"
                : "Resolver pendência"}
            </>} onClose={fecharConfirmacao} busy={processandoId === acaoConfirmacao.atraso.id} footer={<div  className="flex flex-wrap justify-end gap-3">
              <Button onClick={fecharConfirmacao} disabled={processandoId === acaoConfirmacao.atraso.id} type="button" variant="secondary">
                Voltar
              </Button>

              <Button onClick={confirmarAcao} disabled={processandoId === acaoConfirmacao.atraso.id} type="button" variant="danger">
                {processandoId === acaoConfirmacao.atraso.id
                  ? "Processando..."
                  : "Confirmar"}
              </Button>
            </div>}>
            

            {acaoConfirmacao.tipoAcao === "congelar" ? (
              <p>
                Tem certeza que deseja congelar{" "}
                <strong>{acaoConfirmacao.atraso.usuario.nome}</strong>? Ele não
                poderá fazer novas compras, reservas ou aluguéis.
              </p>
            ) : (
              <p>
                Confirmar que a pendência de{" "}
                <strong>{acaoConfirmacao.atraso.usuario.nome}</strong> foi resolvida?
              </p>
            )}

            <div  className="grid gap-2 text-sm text-muted">
              <span>Livro: {acaoConfirmacao.atraso.livro.titulo}</span>
              <span>Tipo: {traduzirTipo(acaoConfirmacao.atraso.tipo)}</span>
              <span>Dias de atraso: {acaoConfirmacao.atraso.diasAtraso}</span>
              <span>Multa: {formatarMoeda(acaoConfirmacao.atraso.multa)}</span>
            </div>

            
          {feedback.type==="error" && feedback.text && <StatusMessage type="error">{feedback.text}</StatusMessage>}</Dialog>
      )}
    </main>
  );
}

export default AdminDelays;