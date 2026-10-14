import { useCallback, useMemo, useState } from "react";
import useInitialLoad from "../components/useInitialLoad.js";
import api from "../api/api.js";
import { useAuth } from "../context/auth.js";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import EditorialHero from "../features/home/EditorialHero.jsx";
import HomeHighlights from "../features/home/HomeHighlights.jsx";
import HomeRankings from "../features/home/HomeRankings.jsx";
const emptyInsights={livrosMaisVendidos:[],generosMaisVendidos:[],livroMaisVendido:null,generoMaisVendido:null};
export default function Home() {
  const {isAuthenticated,isAdmin,usuario}=useAuth();
  const [livros,setLivros]=useState([]);
  const [insights,setInsights]=useState(emptyInsights);
  const [currentBanner,setCurrentBanner]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const carregarHome=useCallback(async()=>{
    setLoading(true);setError("");
    try {
      const [livrosResponse,insightsResponse]=await Promise.all([api.get("/livros"),api.get("/public/home-insights").catch(()=>({data:emptyInsights}))]);
      setLivros(Array.isArray(livrosResponse.data)?livrosResponse.data:[]);
      setInsights(insightsResponse.data && !Array.isArray(insightsResponse.data)?insightsResponse.data:emptyInsights);
    }catch{setError("Não foi possível carregar as leituras. Tente novamente.");}
    finally{setLoading(false);}
  },[]);
  useInitialLoad(carregarHome);
  const livrosDisponiveis=useMemo(()=>livros.filter(livro=>livro.disponivel),[livros]);
  const livrosDestaque=useMemo(()=>{
    const destaques=livrosDisponiveis.filter(livro=>livro.destaque);
    return destaques.length>0?destaques:livrosDisponiveis.slice(0,4);
  },[livrosDisponiveis]);
  const estatisticas=useMemo(()=>({
    total:livrosDisponiveis.length,
    aluguel:livrosDisponiveis.filter(livro=>Number(livro.precoAluguel)>0).length,
    compra:livrosDisponiveis.filter(livro=>Number(livro.precoCompra)>0).length,
    destaques:livrosDisponiveis.filter(livro=>livro.destaque).length,
  }),[livrosDisponiveis]);
  const select=useCallback(index=>setCurrentBanner(index),[]);
  const index=currentBanner<livrosDestaque.length?currentBanner:0;
  const accountAction=isAdmin?{label:"Painel administrativo",to:"/admin"}:isAuthenticated?{label:"Meus pedidos",to:"/meus-pedidos"}:{label:"Criar conta",to:"/cadastro"};
  return <main className="mx-auto max-w-7xl px-5 sm:px-8">
    {isAuthenticated && <p className="pt-6 text-sm text-muted">Bem-vindo{usuario?.nome?`, ${usuario.nome}`:""}.</p>}
    <EditorialHero livro={livrosDestaque[index]} destaques={livrosDestaque} selectedIndex={index} onSelect={select} accountAction={accountAction} loading={loading}/>
    {error && <StatusMessage type="error" onRetry={carregarHome}>{error}</StatusMessage>}
    {!loading && <><dl className="grid grid-cols-2 gap-y-6 border-y border-stroke py-6 sm:grid-cols-4">{[[estatisticas.total,"No acervo"],[estatisticas.compra,"Para comprar"],[estatisticas.aluguel,"Para alugar"],[estatisticas.destaques,"Em destaque"]].map(([count,label])=><div key={label} className="border-l border-stroke pl-4 first:border-l-0 first:pl-0"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-display text-3xl tabular-nums">{count}</dd></div>)}</dl>
    <HomeHighlights livros={livrosDestaque}/><HomeRankings insights={insights}/></>}
    <section className="border-t border-stroke py-14 sm:py-20" aria-labelledby="home-como"><div className="mb-8"><p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">Da escolha à leitura</p><h2 id="home-como" className="font-display text-3xl sm:text-4xl">Como a biblioteca funciona</h2></div><ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {[["Escolha no acervo","Consulte os livros disponíveis e compare os valores de compra e aluguel."],["Defina o seu pedido","Compre, alugue ou reserve. Os prazos e valores aparecem antes da confirmação."],["Acompanhe a leitura","Veja pagamentos, retirada, entrega e devolução nos seus pedidos."],["Fale com a biblioteca","Use o atendimento para tirar dúvidas e acompanhar uma conversa com a equipe."]].map(([title,description],step)=><li key={title} className="border-t border-stroke pt-5"><span className="text-xs text-accent-hover dark:text-accent">{String(step+1).padStart(2,"0")}</span><h3 className="mt-3 font-display text-xl">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted">{description}</p></li>)}
    </ol></section>
  </main>;
}
