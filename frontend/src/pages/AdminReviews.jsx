import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useState } from "react";
import api from "../api/api.js";

function AdminReviews() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [feedback, setFeedback] = useState("");

  const carregar = useCallback(async () => {
    try {
      const url = filtro === "todos" ? "/admin/avaliacoes" : `/admin/avaliacoes?status=${filtro}`;
      const response = await api.get(url);
      setAvaliacoes(response.data || []);
      setFeedback("");
    } catch (error) {
      setFeedback(error.response?.data?.erro || "Erro ao carregar avaliações.");
    }
  }, [filtro]);

  async function alterarStatus(id, status) {
    try {
    await api.patch(`/admin/avaliacoes/${id}/status`, { status });
    carregar();
    } catch (error) { setFeedback(error.response?.data?.erro || "Não foi possível salvar a alteração."); }
  }

  async function remover(id) {
    if (!window.confirm("Remover definitivamente este comentário?")) return;
    try {
      await api.delete(`/admin/avaliacoes/${id}`);
      await carregar();
    } catch (error) { setFeedback(error.response?.data?.erro || "Erro ao remover avaliação."); }
  }

  useInitialLoad(carregar);

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8 grid gap-7">
        <div  className="mb-5 flex flex-wrap items-start justify-between gap-5">
          <div>
            <span  className="mb-3 block text-xs uppercase tracking-[0.16em] text-muted">Moderação</span>
            <h1  className="font-display text-4xl leading-tight sm:text-5xl">Avaliações e comentários</h1>
            <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Aprove, oculte ou remova comentários enviados pelos clientes.</p>
          </div>
          <select aria-label="Status das avaliações" value={filtro} onChange={(event) => setFiltro(event.target.value)} className="min-h-11 w-full min-w-0 rounded-md border border-muted bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted disabled:opacity-60">
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="aprovado">Aprovados</option>
            <option value="oculto">Ocultos</option>
          </select>
        </div>
        {feedback && <StatusMessage type={"error"}>{feedback}</StatusMessage>}
        <div  className="grid gap-5">
          {avaliacoes.map((item) => (
            <article key={item.id} className="min-w-0 border-t border-stroke py-6">
              <div  className="mb-3 flex flex-wrap justify-between gap-3">
                <div><strong>{item.livro?.titulo}</strong><small>{item.usuario?.nome} · {item.usuario?.email}</small></div>
                <span>{item.nota}/5 · {item.status}</span>
              </div>
              <p>{item.comentario}</p>
              <div  className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => alterarStatus(item.id, "aprovado")} type="button" variant="primary">Aprovar</Button>
                <Button onClick={() => alterarStatus(item.id, "oculto")} type="button" variant="secondary">Ocultar</Button>
                <Button onClick={() => remover(item.id)} type="button" variant="danger">Excluir</Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

export default AdminReviews;
