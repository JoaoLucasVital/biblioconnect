import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AtlasExplorer from "../features/atlas/AtlasExplorer.jsx";
import api from "../api/api.js";
import { useAuth } from "../context/auth.js";

import CatalogFilters from "../features/catalog/CatalogFilters.jsx";
import CatalogBookCard from "../features/catalog/CatalogBookCard.jsx";
import PurchaseDialog from "../features/catalog/PurchaseDialog.jsx";
import RentalDialog from "../features/catalog/RentalDialog.jsx";
import ReservationDialog from "../features/catalog/ReservationDialog.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import BookLoader from "../components/ui/BookLoader.jsx";

function calcularMultaReserva(dataRetirada) {
  if (!dataRetirada) {
    return {
      diasAtraso: 0,
      multa: 0,
    };
  }

  const prazoGratis = new Date();
  prazoGratis.setDate(prazoGratis.getDate() + 7);
  prazoGratis.setHours(0, 0, 0, 0);

  const retirada = new Date(dataRetirada);
  retirada.setHours(0, 0, 0, 0);

  const diferencaMs = retirada - prazoGratis;

  const diasAtraso = Math.max(
    0,
    Math.ceil(diferencaMs / (1000 * 60 * 60 * 24))
  );

  const multa = diasAtraso * 2;

  return {
    diasAtraso,
    multa,
  };
}

function calcularAluguel(livro, dias) {
  if (!livro || !dias) {
    return {
      diasExtras: 0,
      valorFinal: 0,
      devolucaoPrevista: null,
    };
  }

  const diasEscolhidos = Number(dias);
  const diasExtras = Math.max(0, diasEscolhidos - Number(livro.diasInclusos));

  const valorFinal =
    Number(livro.precoAluguel) + diasExtras * Number(livro.precoDiaExtra);

  const devolucao = new Date();
  devolucao.setDate(devolucao.getDate() + diasEscolhidos);

  return {
    diasExtras,
    valorFinal,
    devolucaoPrevista: devolucao,
  };
}

function Books() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [livros, setLivros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const [busca, setBusca] = useState(()=>searchParams.get("busca")||"");
  const [categoria, setCategoria] = useState("todas");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const [livroReserva, setLivroReserva] = useState(null);
  const [dataRetirada, setDataRetirada] = useState("");
  const [loadingReserva, setLoadingReserva] = useState(false);

  const [livroAluguel, setLivroAluguel] = useState(null);
  const [diasAluguel, setDiasAluguel] = useState("");
  const [loadingAluguel, setLoadingAluguel] = useState(false);

  const [livroCompra, setLivroCompra] = useState(null);
  const carregarLivros = useCallback(async () => {
    setLoading(true);
    setFeedback({type:"",text:""});
    try {

      const response = await api.get("/livros");
      setLivros(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFeedback({
        type: "error",
        text: "Erro ao carregar catálogo de livros.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  function limparFiltros() {
    setBusca("");
    setCategoria("todas");
    setTipoFiltro("todos");
  }

  function exigirLogin(mensagem) {
    if (!isAuthenticated) {
      setFeedback({ type: "error", text: mensagem });
      return false;
    }

    return true;
  }

  function abrirCompra(livro) {
    if (!exigirLogin("Faça login para comprar um livro.")) return;
    setFeedback({type:"",text:""});setLivroCompra(livro);
  }

  function abrirAluguel(livro) {
    if (!exigirLogin("Faça login para alugar um livro.")) return;

    setFeedback({ type: "", text: "" });
    setLivroAluguel(livro);
    setDiasAluguel(String(livro.diasInclusos || 1));
  }

  async function confirmarAluguel() {
    if (!livroAluguel || loadingAluguel) return;

    const dias = Number(diasAluguel);

    if (!dias || dias <= 0) {
      setFeedback({
        type: "error",
        text: "Informe uma quantidade válida de dias.",
      });
      return;
    }

    try {
      setLoadingAluguel(true);
      setFeedback({ type: "", text: "" });

      const response = await api.post("/alugar", {
        livroId: livroAluguel.id,
        dias,
      });

      setLivroAluguel(null);
      setDiasAluguel("");

      navigate(`/pedido-confirmado/${response.data.id}`);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao alugar livro.",
      });
    } finally {
      setLoadingAluguel(false);
    }
  }

  function abrirReserva(livro) {
    if (!exigirLogin("Faça login para reservar um livro.")) return;

    setFeedback({ type: "", text: "" });
    setLivroReserva(livro);
    setDataRetirada("");
  }

  async function confirmarReserva() {
    if (!livroReserva || loadingReserva) return;
    if (!dataRetirada) {
      setFeedback({
        type: "error",
        text: "Selecione uma data de retirada.",
      });
      return;
    }

    try {
      setLoadingReserva(true);
      setFeedback({ type: "", text: "" });

      const response = await api.post("/reservar", {
        livroId: livroReserva.id,
        dataRetirada,
      });

      setLivroReserva(null);
      setDataRetirada("");

      navigate(`/pedido-confirmado/${response.data.id}`);
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.response?.data?.erro || "Erro ao reservar livro.",
      });
    } finally {
      setLoadingReserva(false);
    }
  }

  useInitialLoad(carregarLivros);
  useEffect(()=>{
    if(!loading && location.hash==="#catalogo")document.getElementById("catalogo")?.scrollIntoView?.();
  },[loading,location.hash]);

  const livrosDisponiveis = useMemo(
    () => livros.filter((livro) => livro.disponivel),
    [livros]
  );

  const categorias = useMemo(() => {
    const lista = livrosDisponiveis
      .map((livro) => livro.categoria)
      .filter(Boolean);

    return ["todas", ...new Set(lista)];
  }, [livrosDisponiveis]);

  const livrosVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return livrosDisponiveis.filter((livro) => {
      const texto = [
        livro.titulo,
        livro.autor,
        livro.categoria,
        livro.sinopse,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const buscaValida = !termo || texto.includes(termo);
      const categoriaValida =
        categoria === "todas" || livro.categoria === categoria;

      const tipoValido =
        tipoFiltro === "todos" ||
        (tipoFiltro === "compra" && Number(livro.precoCompra) > 0) ||
        (tipoFiltro === "aluguel" && Number(livro.precoAluguel) > 0) ||
        (tipoFiltro === "destaque" && livro.destaque);

      return buscaValida && categoriaValida && tipoValido;
    });
  }, [livrosDisponiveis, busca, categoria, tipoFiltro]);

  const reservaCalculada = calcularMultaReserva(dataRetirada);
  const aluguelCalculado = calcularAluguel(livroAluguel, diasAluguel);

  if (loading) return <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8"><BookLoader label="Carregando catálogo…"/></main>;
  const dialogError = feedback.type==="error" ? feedback.text : "";
  const catalogLoadError=feedback.type==="error" && feedback.text==="Erro ao carregar catálogo de livros.";
  return <main className="mx-auto max-w-[1480px] px-5 pb-12 sm:px-8 sm:pb-16">
    <AtlasExplorer livros={livrosDisponiveis} error={catalogLoadError?feedback.text:""} onRetry={carregarLivros} embedded onConsultBook={livro=>{setBusca(livro.titulo);setCategoria("todas");setTipoFiltro("todos");}}/>
    <section id="catalogo" aria-label="Catálogo de livros" className="scroll-mt-6 pt-12 sm:pt-16">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
      <div><p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">O acervo</p><h1 className="font-display text-4xl leading-tight sm:text-5xl">Livros disponíveis</h1><p className="mt-4 max-w-xl text-muted">Encontre a sua próxima leitura. Compre, alugue ou reserve um livro para retirar.</p></div>
      {!catalogLoadError && <p role="status" className="text-sm text-muted"><strong className="text-xl font-medium text-ink">{livrosVisiveis.length}</strong> {livrosVisiveis.length===1?"livro encontrado":"livros encontrados"}</p>}
    </header>
    {feedback.text && !catalogLoadError && !livroCompra && !livroAluguel && !livroReserva && <div className="mb-6"><StatusMessage type={feedback.type==="error"?"error":"info"}>{feedback.text}</StatusMessage></div>}
    {!catalogLoadError && <CatalogFilters busca={busca} categoria={categoria} tipoFiltro={tipoFiltro} categorias={categorias} onBusca={setBusca} onCategoria={setCategoria} onTipo={setTipoFiltro} onClear={limparFiltros}/>}
    {!catalogLoadError && (livrosVisiveis.length===0 ? <section className="border-b border-stroke py-16"><h2 className="font-display text-3xl">Nenhum livro encontrado</h2><p className="mt-3 text-muted">Ajuste os filtros ou volte para descobrir novas leituras no acervo.</p></section> : <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{livrosVisiveis.map(livro=><CatalogBookCard key={livro.id} livro={livro} onComprar={abrirCompra} onAlugar={abrirAluguel} onReservar={abrirReserva} onAvaliacoes={item=>navigate(`/livros/${item.id}/avaliacoes`)}/>)}</div>)}
    <PurchaseDialog livro={livroCompra} onClose={()=>setLivroCompra(null)} onContinuar={()=>navigate(`/checkout/${livroCompra.id}`)}/>
    </section>
    <RentalDialog livro={livroAluguel} dias={diasAluguel} calculo={aluguelCalculado} busy={loadingAluguel} error={dialogError} onDiasChange={setDiasAluguel} onConfirmar={confirmarAluguel} onClose={()=>setLivroAluguel(null)}/>
    <ReservationDialog livro={livroReserva} dataRetirada={dataRetirada} calculo={reservaCalculada} busy={loadingReserva} error={dialogError} onDataChange={setDataRetirada} onConfirmar={confirmarReserva} onClose={()=>setLivroReserva(null)}/>
  </main>;
}
export default Books;
