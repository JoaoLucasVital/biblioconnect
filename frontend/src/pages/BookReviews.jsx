import StatusMessage from "../components/ui/StatusMessage.jsx";
import Field from "../components/ui/Field.jsx";
import Button from "../components/ui/Button.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api.js";
import { useAuth } from "../context/auth.js";

function BookReviews() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [livro, setLivro] = useState(null);
  const [dados, setDados] = useState({ media: 0, total: 0, avaliacoes: [] });
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [enviando,setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [livroResponse, avaliacoesResponse] = await Promise.all([
        api.get(`/livros/${id}`),
        api.get(`/livros/${id}/avaliacoes`),
      ]);
      setLivro(livroResponse.data);
      setDados(avaliacoesResponse.data);
    } catch (error) {
      setFeedback({ type: "error", text: error.response?.data?.erro || "Erro ao carregar avaliações." });
    }
  }, [id]);

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    setEnviando(true);
    try {
      await api.post(`/livros/${id}/avaliacoes`, { nota: Number(nota), comentario });
      setComentario("");
      setFeedback({
        type: "success",
        text: "Avaliação enviada. Ela aparecerá publicamente após a aprovação do administrador.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: error.response?.data?.erro || "Erro ao enviar avaliação." });
    } finally { setEnviando(false); }
  }

  useInitialLoad(carregar);

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8 grid gap-7">
        <div  className="mb-5 flex flex-wrap items-start justify-between gap-5">
          <div>
            <span  className="mb-3 block text-xs uppercase tracking-[0.16em] text-muted">Avaliações</span>
            <h1  className="font-display text-4xl leading-tight sm:text-5xl">{livro?.titulo || "Livro"}</h1>
            <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
              Média {Number(dados.media || 0).toFixed(1)} / 5 · {dados.total} avaliação(ões) aprovada(s)
            </p>
          </div>
          <Link to="/livros" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">Voltar ao catálogo</Link>
        </div>

        {feedback.text && <StatusMessage type={feedback.type}>{feedback.text}</StatusMessage>}

        {isAuthenticated ? (
          <form onSubmit={enviar} className="min-w-0 border-t border-stroke py-6 grid max-w-xl gap-5">
            <h2  className="font-display text-2xl leading-snug">Avaliar este livro</h2>
            <div className="grid gap-2"><Field label={"Nota"}><select value={nota} onChange={(event) => setNota(event.target.value)}>
                <option value="5">5 - Excelente</option>
                <option value="4">4 - Muito bom</option>
                <option value="3">3 - Bom</option>
                <option value="2">2 - Regular</option>
                <option value="1">1 - Ruim</option>
              </select></Field></div>
            <div className="grid gap-2"><Field label={"Comentário"}><textarea value={comentario} onChange={(event) => setComentario(event.target.value)} minLength="3" maxLength="1500" required placeholder="Conte o que achou do livro..."/></Field></div>
            <Button type="submit" variant="primary" busy={enviando}>Enviar para moderação</Button>
          </form>
        ) : (
          <div  className="min-w-0 border-t border-stroke py-6">
            <p>Entre na sua conta para publicar uma avaliação.</p>
            <Link to="/login" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-transparent bg-accent text-[#1e293b] hover:bg-accent-hover">Fazer login</Link>
          </div>
        )}

        <section  className="grid gap-5">
          {dados.avaliacoes?.length ? dados.avaliacoes.map((avaliacao) => (
            <article key={avaliacao.id} className="min-w-0 border-t border-stroke py-6">
              <div  className="mb-3 flex flex-wrap justify-between gap-3">
                <strong>{avaliacao.usuario?.nome || "Leitor"}</strong>
                <span>{"★".repeat(avaliacao.nota)}{"☆".repeat(5 - avaliacao.nota)}</span>
              </div>
              <p>{avaliacao.comentario}</p>
              <small>{new Date(avaliacao.createdAt).toLocaleDateString("pt-BR")}</small>
            </article>
          )) : <div  className="my-8 border-y border-stroke py-12 text-muted [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink"><p>Ainda não há avaliações aprovadas.</p></div>}
        </section>
      </div>
    </main>
  );
}

export default BookReviews;
