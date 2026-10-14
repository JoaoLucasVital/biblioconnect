import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import Dialog from "../components/ui/Dialog.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import IsbnLookup from "../components/IsbnLookup.jsx";

function AddBooks() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    isbn: "",
    titulo: "",
    autor: "",
    redator: "",
    ano: "",
    categoria: "",
    sinopse: "",
    precoCompra: "",
    precoAluguel: "",
    diasInclusos: "",
    precoDiaExtra: "",
    estoque: "",
    isDoado: false,
    destaque: false,
    disponivel: true,
  });

  const [imagem, setImagem] = useState(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [imagemUrlExterna, setImagemUrlExterna] = useState("");

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleImagemChange(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      setImagem(null);
      setPreviewImagem("");
      return;
    }

    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!formatosPermitidos.includes(arquivo.type)) {
      setErro("Envie uma imagem nos formatos JPG, PNG ou WEBP.");
      setImagem(null);
      setPreviewImagem("");
      event.target.value = "";
      return;
    }

    const tamanhoMaximo = 5 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
      setErro("A imagem deve ter no máximo 5MB.");
      setImagem(null);
      setPreviewImagem("");
      event.target.value = "";
      return;
    }

    setErro("");
    setImagem(arquivo);
    setPreviewImagem(URL.createObjectURL(arquivo));
  }

  function montarFormData() {
    const dados = new FormData();

    dados.append("isbn", form.isbn || "");
    dados.append("imagemUrlExterna", imagemUrlExterna || "");
    dados.append("titulo", form.titulo);
    dados.append("autor", form.autor);
    dados.append("redator", form.redator);
    dados.append("ano", form.ano);
    dados.append("categoria", form.categoria);
    dados.append("sinopse", form.sinopse);
    dados.append("precoCompra", form.precoCompra);
    dados.append("precoAluguel", form.precoAluguel);
    dados.append("diasInclusos", form.diasInclusos);
    dados.append("precoDiaExtra", form.precoDiaExtra);
    dados.append("estoque", form.estoque);
    dados.append("isDoado", String(form.isDoado));
    dados.append("destaque", String(form.destaque));
    dados.append("disponivel", String(form.disponivel));

    if (imagem) {
      dados.append("imagem", imagem);
    }

    return dados;
  }

  function aplicarDadosIsbn(dados) {
    setForm((prev) => ({
      ...prev,
      isbn: dados.isbn || prev.isbn,
      titulo: dados.titulo || prev.titulo,
      autor: dados.autor || prev.autor,
      redator: dados.redator || prev.redator,
      ano: dados.ano || prev.ano,
      categoria: dados.categoria || prev.categoria,
      sinopse: dados.sinopse || prev.sinopse,
    }));

    if (dados.imagemUrl) {
      setImagemUrlExterna(dados.imagemUrl);
      setPreviewImagem(dados.imagemUrl);
    }
  }

  async function cadastrarLivro() {
    if (loading) return;
    setErro("");
    setLoading(true);

    try {
      const dadosLivro = montarFormData();

      await api.post("/livros", dadosLivro);

      setShowConfirm(false);
      navigate("/admin/livros");
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao cadastrar livro.");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.titulo || !form.autor || !form.categoria || !form.sinopse) {
      setErro("Preencha as informações principais do livro.");
      return;
    }

    setShowConfirm(true);
  }

  useEffect(() => {
    return () => {
      if (previewImagem) {
        URL.revokeObjectURL(previewImagem);
      }
    };
  }, [previewImagem]);

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div  className="mb-5 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1  className="font-display text-4xl leading-tight sm:text-5xl">Adicionar Livro</h1>
            <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
              Cadastre um novo livro no catálogo da biblioteca.
            </p>
          </div>

          <Button onClick={() => navigate("/admin")} type="button" variant="secondary">
            Voltar ao painel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid min-w-0 gap-8">
          <div  className="grid min-w-0 gap-5 border-t border-stroke pt-6">
            <h2  className="font-display text-2xl leading-snug">Identificação por ISBN</h2>
            <p  className="text-sm leading-relaxed text-muted">
              Digite o ISBN para preencher automaticamente título, autor, editora, ano, categoria, sinopse e capa quando esses dados existirem.
            </p>
            <IsbnLookup value={form.isbn} onChange={(isbn) => setForm((prev) => ({ ...prev, isbn }))} onFound={aplicarDadosIsbn}/>
          </div>

          <div  className="grid min-w-0 gap-5 border-t border-stroke pt-6">
            <div>
              <h2  className="font-display text-2xl leading-snug">Capa do livro</h2>
              <p  className="text-sm leading-relaxed text-muted">
                Envie uma imagem em JPG, PNG ou WEBP. Ela aparecerá no catálogo,
                no painel admin e no slider da Home quando o livro estiver em destaque.
              </p>
            </div>

            <div  className="grid min-w-0 gap-6 sm:grid-cols-[144px_1fr]">
              <div  className="grid aspect-[2/3] min-w-0 place-items-center overflow-hidden bg-soft">
                {previewImagem ? (
                  <img src={previewImagem} alt="Prévia da capa do livro" className="h-full w-full object-contain"/>
                ) : (
                  <div  className="grid gap-2 p-4 text-center text-sm text-muted">
                    <span>Sem imagem</span>
                    <small>A prévia da capa aparecerá aqui</small>
                  </div>
                )}
              </div>

              <div className="grid gap-2"><Field label={"Imagem da capa"}><input type="file" name="imagem" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={handleImagemChange} /></Field><small  className="text-xs text-muted">
                  Tamanho máximo: 5MB. Recomendado: imagem vertical de capa.
                </small>{imagem && (
                  <div  className="text-sm text-muted">
                    <strong>Arquivo selecionado:</strong>
                    <span>{imagem.name}</span>
                  </div>
                )}</div>
            </div>
          </div>

          <div  className="grid min-w-0 gap-5 border-t border-stroke pt-6">
            <h2  className="font-display text-2xl leading-snug">Informações principais</h2>

            <div  className="grid min-w-0 gap-5 md:grid-cols-2">
              <div className="grid gap-2"><Field label={"Título"}><input type="text" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ex: Dom Casmurro" required /></Field></div>

              <div className="grid gap-2"><Field label={"Autor"}><input type="text" name="autor" value={form.autor} onChange={handleChange} placeholder="Ex: Machado de Assis" required /></Field></div>

              <div className="grid gap-2"><Field label={"Redator/Editora"}><input type="text" name="redator" value={form.redator} onChange={handleChange} placeholder="Ex: Editora Nacional" required /></Field></div>

              <div className="grid gap-2"><Field label={"Ano"}><input type="number" name="ano" value={form.ano} onChange={handleChange} placeholder="Ex: 1899" required /></Field></div>

              <div className="grid gap-2"><Field label={"Categoria"}><input type="text" name="categoria" value={form.categoria} onChange={handleChange} placeholder="Ex: Romance" required /></Field></div>

              <div className="grid gap-2"><Field label={"Estoque"}><input type="number" name="estoque" value={form.estoque} onChange={handleChange} placeholder="Ex: 10" required /></Field></div>
            </div>

            <div className="grid gap-2"><Field label={"Sinopse"}><textarea name="sinopse" value={form.sinopse} onChange={handleChange} placeholder="Digite uma breve descrição do livro" required /></Field></div>
          </div>

          <div  className="grid min-w-0 gap-5 border-t border-stroke pt-6">
            <h2  className="font-display text-2xl leading-snug">Valores e aluguel</h2>

            <div  className="grid min-w-0 gap-5 md:grid-cols-2">
              <div className="grid gap-2"><Field label={"Preço de compra"}><input type="number" step="0.01" name="precoCompra" value={form.precoCompra} onChange={handleChange} placeholder="Ex: 39.90" required /></Field></div>

              <div className="grid gap-2"><Field label={"Preço de aluguel"}><input type="number" step="0.01" name="precoAluguel" value={form.precoAluguel} onChange={handleChange} placeholder="Ex: 8.00" required /></Field></div>

              <div className="grid gap-2"><Field label={"Dias inclusos"}><input type="number" name="diasInclusos" value={form.diasInclusos} onChange={handleChange} placeholder="Ex: 7" required /></Field></div>

              <div className="grid gap-2"><Field label={"Preço por dia extra"}><input type="number" step="0.01" name="precoDiaExtra" value={form.precoDiaExtra} onChange={handleChange} placeholder="Ex: 2.00" required /></Field></div>
            </div>

            <label  className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" name="isDoado" checked={form.isDoado} onChange={handleChange} className="h-4 w-4 shrink-0 accent-accent"/>
              <span>Este livro é doado?</span>
            </label>

            <label  className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" name="destaque" checked={form.destaque} onChange={handleChange} className="h-4 w-4 shrink-0 accent-accent"/>
              <span>Colocar este livro em destaque no slider da Home?</span>
            </label>

            <label  className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" name="disponivel" checked={form.disponivel} onChange={handleChange} className="h-4 w-4 shrink-0 accent-accent"/>
              <span>Livro disponível para venda, aluguel e reserva?</span>
            </label>
          </div>

          {erro && <StatusMessage type={"error"}>{erro}</StatusMessage>}

          <div  className="flex flex-wrap justify-end gap-3 border-t border-stroke pt-6">
            <Button type="button" onClick={() => navigate("/admin")} variant="secondary">
              Cancelar
            </Button>

            <Button disabled={loading} type="submit" variant="primary">
              {loading ? "Cadastrando..." : "Cadastrar Livro"}
            </Button>
          </div>
        </form>
      </div>

      {showConfirm && (
        <Dialog open title={<>Confirmar cadastro</>} onClose={() => setShowConfirm(false)} busy={loading} footer={<div  className="flex flex-wrap justify-end gap-3">
              <Button onClick={() => setShowConfirm(false)} disabled={loading} type="button" variant="secondary">
                Revisar
              </Button>

              <Button onClick={cadastrarLivro} disabled={loading} type="button" variant="primary">
                {loading ? "Salvando..." : "Confirmar"}
              </Button>
            </div>}>
            

            <p>
              Deseja cadastrar o livro <strong>{form.titulo}</strong> no
              catálogo?
            </p>

            <div  className="grid gap-2 text-sm text-muted">
              <span>Autor: {form.autor}</span>
              <span>Categoria: {form.categoria}</span>
              <span>Estoque: {form.estoque}</span>
              <span>Destaque: {form.destaque ? "Sim" : "Não"}</span>
              <span>Imagem: {imagem ? imagem.name : "Não enviada"}</span>
            </div>

            {previewImagem && (
              <div  className="mx-auto max-h-48 w-auto object-contain">
                <img src={previewImagem} alt="Prévia da capa no popup"/>
              </div>
            )}

            
          {erro && <StatusMessage type="error">{erro}</StatusMessage>}</Dialog>
      )}
    </main>
  );
}

export default AddBooks;