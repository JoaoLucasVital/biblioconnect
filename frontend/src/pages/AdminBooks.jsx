import {AnimatedHeading} from '../components/motion/TextAnimations.jsx';
import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import BookCover from "../components/ui/BookCover.jsx";
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

function AdminBookCover({livro}) { return <div  className="w-20 shrink-0"><BookCover livro={livro}/></div>; }
function AdminBooks() {
  const [livros, setLivros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [livroParaExcluir, setLivroParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarLivros = useCallback(async () => {
    try {

      const response = await api.get("/livros");

      setLivros(Array.isArray(response.data) ? response.data : []);
    } catch {
      setErro("Erro ao carregar livros.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function alternarDisponibilidade(livro) {
    try {
      setMensagem("");
      setErro("");

      await api.patch(`/livros/${livro.id}/disponibilidade`, {
        disponivel: !livro.disponivel,
      });

      setMensagem(
        !livro.disponivel
          ? "Livro ativado com sucesso."
          : "Livro pausado com sucesso."
      );

      carregarLivros();
    } catch (error) {
      setErro(
        error.response?.data?.erro ||
          "Erro ao alterar disponibilidade do livro."
      );
    }
  }

  async function alternarDestaque(livro) {
    try {
      setMensagem("");
      setErro("");

      await api.patch(`/livros/${livro.id}/destaque`, {
        destaque: !livro.destaque,
      });

      setMensagem(
        !livro.destaque
          ? "Livro colocado em destaque."
          : "Livro removido dos destaques."
      );

      carregarLivros();
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao alterar destaque.");
    }
  }

  async function confirmarExclusao() {
    if (!livroParaExcluir || excluindo) return;

    try {
      setExcluindo(true);
      setMensagem("");
      setErro("");

      await api.delete(`/livros/${livroParaExcluir.id}`);

      setMensagem("Livro excluído com sucesso.");
      setLivroParaExcluir(null);
      carregarLivros();
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao excluir livro.");
    } finally {
      setExcluindo(false);
    }
  }

  useInitialLoad(carregarLivros);

  if (loading) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando livros...</p>
        </div>
      </main>
    );
  }

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div  className="mb-5 flex flex-wrap items-start justify-between gap-5">
          <div>
            <AnimatedHeading  className="font-display text-4xl leading-tight sm:text-5xl">Gerenciar Livros</AnimatedHeading>
            <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
              Edite, pause, destaque ou exclua livros do catálogo.
            </p>
          </div>

          <Link to="/adicionar-livro" className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-transparent bg-accent text-[#0f172a] hover:bg-accent-hover">
            Novo Livro
          </Link>
        </div>

        {erro && <StatusMessage type={"error"}>{erro}</StatusMessage>}
        {mensagem && <StatusMessage type={"info"}>{mensagem}</StatusMessage>}

        {livros.length === 0 ? (
          <div  className="my-8 border-y border-stroke py-12 text-muted [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">
            <h2  className="font-display text-2xl leading-snug">Nenhum livro cadastrado</h2>
            <p>Cadastre o primeiro livro para ele aparecer no catálogo.</p>
          </div>
        ) : (
          <div  className="mt-8 grid gap-6">
            {livros.map((livro) => (
              <div key={livro.id} className="min-w-0 border-t border-stroke py-6 grid gap-6 xl:grid-cols-[1fr_auto]">
                <div  className="flex min-w-0 items-start gap-5 [&_small]:mt-2 [&_small]:block [&_small]:text-xs [&_small]:text-muted">
                  <AdminBookCover livro={livro}/>

                  <div>
                    <div  className="mb-2 flex flex-wrap items-center gap-2 [&_h2]:wrap-anywhere [&_h2]:font-display [&_h2]:text-2xl">
                      <h2  className="font-display text-2xl leading-snug">{livro.titulo}</h2>

                      {livro.destaque && (
                        <span  className="rounded bg-soft px-2 py-1 text-xs">Destaque</span>
                      )}

                      {!livro.disponivel && (
                        <span  className="rounded bg-soft px-2 py-1 text-xs">Pausado</span>
                      )}
                    </div>

                    <p>{livro.autor}</p>

                    <small>
                      {livro.categoria} • Estoque: {livro.estoque} • Compra:{" "}
                      {formatarMoeda(livro.precoCompra)} • Aluguel:{" "}
                      {formatarMoeda(livro.precoAluguel)}
                    </small>

                    {livro.imagemUrl ? (
                      <span  className="text-xs text-muted">
                        Imagem cadastrada
                      </span>
                    ) : (
                      <span  className="text-xs text-muted text-red-700 dark:text-red-300">
                        Sem imagem de capa
                      </span>
                    )}
                  </div>
                </div>

                <div  className="flex flex-wrap items-center gap-2">
                  <Link to={`/editar-livro/${livro.id}`} className="bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium border-muted bg-surface text-ink hover:bg-soft">
                    Editar
                  </Link>

                  <Button onClick={() => alternarDisponibilidade(livro)} type="button" variant="secondary">
                    {livro.disponivel ? "Pausar" : "Ativar"}
                  </Button>

                  <Button onClick={() => alternarDestaque(livro)} type="button" variant="secondary">
                    {livro.destaque ? "Remover Destaque" : "Destacar"}
                  </Button>

                  <Button onClick={() => setLivroParaExcluir(livro)} type="button" variant="danger">
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {livroParaExcluir && (
        <Dialog open title={<>Excluir livro</>} onClose={() => setLivroParaExcluir(null)} busy={excluindo} footer={<div  className="flex flex-wrap justify-end gap-3">
              <Button onClick={() => setLivroParaExcluir(null)} disabled={excluindo} type="button" variant="secondary">
                Cancelar
              </Button>

              <Button onClick={confirmarExclusao} disabled={excluindo} type="button" variant="danger">
                {excluindo ? "Excluindo..." : "Confirmar exclusão"}
              </Button>
            </div>}>
            

            <p>
              Tem certeza que deseja excluir{" "}
              <strong>{livroParaExcluir.titulo}</strong>?
            </p>

            <div  className="flex min-w-0 items-start gap-4">
              <AdminBookCover livro={livroParaExcluir}/>

              <div  className="grid gap-2 text-sm text-muted">
                <span>Autor: {livroParaExcluir.autor}</span>
                <span>Categoria: {livroParaExcluir.categoria}</span>
                <span>Estoque: {livroParaExcluir.estoque}</span>
                <span>
                  Compra: {formatarMoeda(livroParaExcluir.precoCompra)}
                </span>
              </div>
            </div>

            <p  className="text-sm text-red-700 dark:text-red-300">
              Essa ação só será permitida se o livro não tiver pedidos
              vinculados. Caso tenha pedidos, pause o livro em vez de excluir.
            </p>

            
          {erro && <StatusMessage type="error">{erro}</StatusMessage>}</Dialog>
      )}
    </main>
  );
}

export default AdminBooks;
