import { useCallback, useMemo, useState } from "react";
import {AnimatedHeading} from '../components/motion/TextAnimations.jsx';
import useInitialLoad from "../components/useInitialLoad.js";
import api from "../api/api.js";
import { useAuth } from "../context/auth.js";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import BookLoader from "../components/ui/BookLoader.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import ImageStreamHero from "../features/home/ImageStreamHero.jsx";
import { AnimatedContent, ScrollExpand, StarBorder } from "../features/home/DiscoveryMotion.jsx";
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
    const selection=destaques.length>0?destaques:livrosDisponiveis.slice(0,4);
    const groups=new Map();
    for(const book of selection){const key=book.categoria||"Sem categoria";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(book);}
    const mixed=[];
    for(let round=0;mixed.length<selection.length;round++)for(const group of groups.values())if(group[round])mixed.push(group[round]);
    return mixed;
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
  return <main className="mx-auto max-w-[1480px] px-5 sm:px-8">
    {loading?<div className="stream-hero-loading"><BookLoader label="Carregando leituras…"/></div>:error?<div className="py-20"><StatusMessage type="error" onRetry={carregarHome}>{error}</StatusMessage></div>:<ImageStreamHero livros={livrosDestaque}/>}
    {isAuthenticated && <p className="pt-6 text-sm text-muted">Bem-vindo{usuario?.nome?`, ${usuario.nome}`:""}.</p>}
    {!loading && !error && <><div className="home-edition"><span><strong>{estatisticas.total} leituras</strong> para descobrir</span><span>Compre, alugue ou reserve. Do seu jeito.</span></div>
    <AnimatedContent><ScrollExpand><HomeHighlights livros={livrosDestaque}/></ScrollExpand></AnimatedContent>
    <AnimatedContent><StarBorder><section className="discovery-atlas-invite" aria-labelledby="home-atlas-title"><div className="discovery-constellation" aria-hidden="true"><svg viewBox="0 0 320 260"><path d="M30 170 95 65 170 120 260 30M95 65 125 215 255 180 170 120 30 170M255 180 290 245" fill="none" stroke="currentColor"/>{[[30,170],[95,65],[170,120],[260,30],[125,215],[255,180],[290,245]].map(([cx,cy])=><circle key={cx} cx={cx} cy={cy} r="3" fill="currentColor"/>)}</svg></div><div className="relative"><p className="mb-3 text-xs tracking-[.15em] uppercase text-muted">O próximo livro pode estar conectado</p><AnimatedHeading as="h2" id="home-atlas-title">Siga uma história.<br/><em>Encontre outras.</em></AnimatedHeading><p>Explore as conexões entre autores e gêneros no Atlas do acervo. Escolha um ponto e descubra para onde ele leva.</p></div><Link to="/livros" className="relative inline-flex min-h-12 items-center gap-3 font-medium underline">Explorar o Atlas<ArrowUpRight size={19} aria-hidden="true"/></Link></section></StarBorder></AnimatedContent>
    {livrosDestaque.length>0 && <EditorialHero compact livro={livrosDestaque[index]} destaques={livrosDestaque} selectedIndex={index} onSelect={select} accountAction={accountAction}/>}
    {livrosDestaque.length===0 && <div className="py-5"><a className="underline" href={accountAction.to}>{accountAction.label}</a></div>}
    <AnimatedContent><HomeRankings insights={insights}/></AnimatedContent></>}
    <section className="border-t border-stroke py-14 sm:py-20" aria-labelledby="home-como"><div className="mb-8"><p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted">Da escolha à leitura</p><AnimatedHeading as="h2" id="home-como" className="font-display text-3xl sm:text-4xl">Como a biblioteca funciona</AnimatedHeading></div><ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {[["Escolha no acervo","Consulte os livros disponíveis e compare os valores de compra e aluguel."],["Defina o seu pedido","Compre, alugue ou reserve. Os prazos e valores aparecem antes da confirmação."],["Acompanhe a leitura","Veja pagamentos, retirada, entrega e devolução nos seus pedidos."],["Fale com a biblioteca","Use o atendimento para tirar dúvidas e acompanhar uma conversa com a equipe."]].map(([title,description],step)=><li key={title} className="border-t border-stroke pt-5"><span className="text-xs text-accent-hover dark:text-accent">{String(step+1).padStart(2,"0")}</span><h3 className="mt-3 font-display text-xl">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted">{description}</p></li>)}
    </ol></section>
  </main>;
}
