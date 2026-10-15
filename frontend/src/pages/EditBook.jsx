import {AnimatedHeading} from '../components/motion/TextAnimations.jsx';
import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api.js";
import {prepareBookUpload} from "../api/bookUpload.js";
import IsbnLookup from "../components/IsbnLookup.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function montarUrlImagem(imagemUrl) {
  if (!imagemUrl) return "";

  if (imagemUrl.startsWith("http://") || imagemUrl.startsWith("https://")) {
    return imagemUrl;
  }

  return `${API_URL}${imagemUrl}`;
}

function EditBook() {
  const { id } = useParams();
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

  const [imagemAtual, setImagemAtual] = useState("");
  const [novaImagem, setNovaImagem] = useState(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [imagemUrlExterna, setImagemUrlExterna] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarLivro = useCallback(async () => {
    try {

      const response = await api.get(`/livros/${id}`);
      const livro = response.data;

      setForm({
        isbn: livro.isbn || "",
        titulo: livro.titulo || "",
        autor: livro.autor || "",
        redator: livro.redator || "",
        ano: livro.ano || "",
        categoria: livro.categoria || "",
        sinopse: livro.sinopse || "",
        precoCompra: livro.precoCompra ?? "",
        precoAluguel: livro.precoAluguel ?? "",
        diasInclusos: livro.diasInclusos ?? "",
        precoDiaExtra: livro.precoDiaExtra ?? "",
        estoque: livro.estoque ?? "",
        isDoado: Boolean(livro.isDoado),
        destaque: Boolean(livro.destaque),
        disponivel: Boolean(livro.disponivel),
      });

      setImagemAtual(livro.imagemUrl || "");
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao carregar livro.");
    } finally {
      setLoading(false);
    }
  }, [id]);

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
      setNovaImagem(null);
      setPreviewImagem("");
      return;
    }

    const formatosPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
    ];

    if (!formatosPermitidos.includes(arquivo.type)) {
      setErro("Envie uma imagem nos formatos JPG, PNG ou WEBP.");
      setNovaImagem(null);
      setPreviewImagem("");
      event.target.value = "";
      return;
    }

    const tamanhoMaximo = 5 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
      setErro("A imagem deve ter no máximo 5MB.");
      setNovaImagem(null);
      setPreviewImagem("");
      event.target.value = "";
      return;
    }

    setErro("");
    setNovaImagem(arquivo);
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

    if (novaImagem) {
      dados.append("imagem", novaImagem);
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
      setImagemAtual(dados.imagemUrl);
      setPreviewImagem("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setErro("");
    setSucesso("");

    try {
      const dadosLivro = await prepareBookUpload(montarFormData());

      await api.put(`/livros/${id}`, dadosLivro);

      setSucesso("Livro atualizado com sucesso!");

      setTimeout(() => {
        navigate("/admin/livros");
      }, 1000);
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao atualizar livro.");
    } finally {
      setSaving(false);
    }
  }

  useInitialLoad(carregarLivro);

  useEffect(() => {
    return () => {
      if (previewImagem) {
        URL.revokeObjectURL(previewImagem);
      }
    };
  }, [previewImagem]);

  if (loading) {
    return (
      <main  className="py-10 sm:py-14">
        <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Carregando livro...</p>
        </div>
      </main>
    );
  }

  const imagemParaExibir = previewImagem || montarUrlImagem(imagemAtual);

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div  className="mb-5 flex flex-wrap items-start justify-between gap-5">
          <div>
            <AnimatedHeading  className="font-display text-4xl leading-tight sm:text-5xl">Editar Livro</AnimatedHeading>
            <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">
              Atualize as informações, destaque, disponibilidade e imagem do
              livro.
            </p>
          </div>

          <Button onClick={() => navigate("/admin/livros")} type="button" variant="secondary">
            Voltar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid min-w-0 gap-8">
          <div  className="grid min-w-0 gap-5 border-t border-stroke pt-6">
            <h2  className="font-display text-2xl leading-snug">Identificação por ISBN</h2>
            <p  className="text-sm leading-relaxed text-muted">Consulte o Google Books para atualizar os dados bibliográficos automaticamente.</p>
            <IsbnLookup value={form.isbn} onChange={(isbn) => setForm((prev) => ({ ...prev, isbn }))} onFound={aplicarDadosIsbn}/>
          </div>
          <div  className="grid min-w-0 gap-5 border-t border-stroke pt-6">
            <div>
              <h2  className="font-display text-2xl leading-snug">Capa do livro</h2>
              <p  className="text-sm leading-relaxed text-muted">
                A capa atual será mantida se você não selecionar uma nova
                imagem.
              </p>
            </div>

            <div  className="grid min-w-0 gap-6 sm:grid-cols-[144px_1fr]">
              <div  className="grid aspect-[2/3] min-w-0 place-items-center overflow-hidden bg-soft">
                {imagemParaExibir ? (
                  <img src={imagemParaExibir} alt="Capa atual do livro" className="h-full w-full object-contain"/>
                ) : (
                  <div  className="grid gap-2 p-4 text-center text-sm text-muted">
                    <span>Sem imagem</span>
                    <small>Este livro ainda não possui capa cadastrada</small>
                  </div>
                )}
              </div>

              <div className="grid gap-2"><Field label={"Trocar imagem da capa"}><input type="file" name="imagem" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={handleImagemChange} /></Field><small  className="text-xs text-muted">
                  Tamanho máximo: 5MB. Formatos aceitos: JPG, PNG ou WEBP.
                </small>{novaImagem ? (
                  <div  className="text-sm text-muted">
                    <strong>Nova imagem selecionada:</strong>
                    <span>{novaImagem.name}</span>
                  </div>
                ) : (
                  <div  className="text-sm text-muted">
                    <strong>Imagem atual:</strong>
                    <span>
                      {imagemAtual
                        ? "A capa cadastrada será mantida."
                        : "Nenhuma imagem cadastrada ainda."}
                    </span>
                  </div>
                )}</div>
            </div>
          </div>

          <div  className="grid min-w-0 gap-5 border-t border-stroke pt-6">
            <h2  className="font-display text-2xl leading-snug">Informações principais</h2>

            <div  className="grid min-w-0 gap-5 md:grid-cols-2">
              <div className="grid gap-2"><Field label={"Título"}><input type="text" name="titulo" value={form.titulo} onChange={handleChange} required /></Field></div>

              <div className="grid gap-2"><Field label={"Autor"}><input type="text" name="autor" value={form.autor} onChange={handleChange} required /></Field></div>

              <div className="grid gap-2"><Field label={"Redator/Editora"}><input type="text" name="redator" value={form.redator} onChange={handleChange} required /></Field></div>

              <div className="grid gap-2"><Field label={"Ano"}><input type="number" name="ano" value={form.ano} onChange={handleChange} required /></Field></div>

              <div className="grid gap-2"><Field label={"Categoria"}><input type="text" name="categoria" value={form.categoria} onChange={handleChange} required /></Field></div>

              <div className="grid gap-2"><Field label={"Estoque"}><input type="number" name="estoque" value={form.estoque} onChange={handleChange} required /></Field></div>
            </div>

            <div className="grid gap-2"><Field label={"Sinopse"}><textarea name="sinopse" value={form.sinopse} onChange={handleChange} required /></Field></div>
          </div>

          <div  className="grid min-w-0 gap-5 border-t border-stroke pt-6">
            <h2  className="font-display text-2xl leading-snug">Valores e configurações</h2>

            <div  className="grid min-w-0 gap-5 md:grid-cols-2">
              <div className="grid gap-2"><Field label={"Preço de compra"}><input type="number" step="0.01" name="precoCompra" value={form.precoCompra} onChange={handleChange} required /></Field></div>

              <div className="grid gap-2"><Field label={"Preço de aluguel"}><input type="number" step="0.01" name="precoAluguel" value={form.precoAluguel} onChange={handleChange} required /></Field></div>

              <div className="grid gap-2"><Field label={"Dias inclusos"}><input type="number" name="diasInclusos" value={form.diasInclusos} onChange={handleChange} required /></Field></div>

              <div className="grid gap-2"><Field label={"Preço por dia extra"}><input type="number" step="0.01" name="precoDiaExtra" value={form.precoDiaExtra} onChange={handleChange} required /></Field></div>
            </div>

            <label  className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" name="isDoado" checked={form.isDoado} onChange={handleChange} className="h-4 w-4 shrink-0 accent-accent"/>
              <span>Este livro é doado?</span>
            </label>

            <label  className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" name="destaque" checked={form.destaque} onChange={handleChange} className="h-4 w-4 shrink-0 accent-accent"/>
              <span>
                {form.destaque
                  ? "Manter livro em destaque"
                  : "Colocar livro em destaque"}
              </span>
            </label>

            <label  className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" name="disponivel" checked={form.disponivel} onChange={handleChange} className="h-4 w-4 shrink-0 accent-accent"/>
              <span>Livro disponível para venda, aluguel e reserva?</span>
            </label>
          </div>

          {erro && <StatusMessage type={"error"}>{erro}</StatusMessage>}
          {sucesso && <StatusMessage type={"info"}>{sucesso}</StatusMessage>}

          <div  className="flex flex-wrap justify-end gap-3 border-t border-stroke pt-6">
            <Button type="button" onClick={() => navigate("/admin/livros")} variant="secondary">
              Cancelar
            </Button>

            <Button disabled={saving} type="submit" variant="primary">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default EditBook;
