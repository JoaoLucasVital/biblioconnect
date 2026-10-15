import {useCallback,useState} from 'react';
import {Check,EyeOff,Trash2,MessageSquare,Star,Clock3} from 'lucide-react';
import api from '../../api/api.js';
import useInitialLoad from '../../components/useInitialLoad.js';
import Button from '../../components/ui/Button.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {AnimatedHeading} from '../../components/motion/TextAnimations.jsx';
import RatingStars from './RatingStars.jsx';
import './reviews.css';
const labels={todos:'Todas',pendente:'Pendentes',aprovado:'Aprovadas',oculto:'Ocultas'};
const statuses={pendente:'Pendente',aprovado:'Aprovada',oculto:'Oculta'};
export default function ReviewModeration(){
  const [items,setItems]=useState([]),[filter,setFilter]=useState('todos'),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(null);
  const load=useCallback(async()=>{setLoading(true);try{const {data}=await api.get('/admin/avaliacoes');setItems(Array.isArray(data)?data:[]);setError('');}catch(e){setError(e.response?.data?.erro||'Não foi possível carregar as avaliações.');}finally{setLoading(false);}},[]);
  useInitialLoad(load);
  async function moderate(item,status){if(busy)return;setBusy(item.id);try{await api.patch(`/admin/avaliacoes/${item.id}/status`,{status});setItems(previous=>previous.map(x=>x.id===item.id?{...x,status}:x));setError('');}catch(e){setError(e.response?.data?.erro||'Não foi possível alterar a avaliação.');}finally{setBusy(null);}}
  async function remove(item){if(busy||!window.confirm('Remover definitivamente este comentário?'))return;setBusy(item.id);try{await api.delete(`/admin/avaliacoes/${item.id}`);setItems(previous=>previous.filter(x=>x.id!==item.id));setError('');}catch(e){setError(e.response?.data?.erro||'Não foi possível excluir a avaliação.');}finally{setBusy(null);}}
  const visible=items.filter(x=>filter==='todos'||x.status===filter),average=items.length?items.reduce((sum,x)=>sum+Number(x.nota||0),0)/items.length:0;
  return <main className="mx-auto grid w-full max-w-7xl gap-7 px-5 py-10 sm:px-8 sm:py-14">
    <header className="border-b border-stroke pb-7"><p className="mb-3 text-xs uppercase tracking-[.16em] text-muted">Biblioteca / Moderação</p><AnimatedHeading className="font-display text-4xl leading-tight sm:text-5xl">Vozes do acervo.</AnimatedHeading><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">Avaliações e comentários: acompanhe o que os leitores dizem e cuide do que aparece na biblioteca.</p></header>
    <div className="review-metrics"><div><MessageSquare size={18}/><span>Avaliações recebidas</span><strong>{items.length}</strong></div><div><Clock3 size={18}/><span>Aguardando moderação</span><strong>{items.filter(x=>x.status==='pendente').length}</strong></div><div><Star size={18}/><span>Nota dos leitores</span><strong>{average.toFixed(1)}<small> / 5</small></strong></div></div>
    <nav aria-label="Status das avaliações" className="flex flex-wrap gap-2">{Object.entries(labels).map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} className="review-filter" onClick={()=>setFilter(value)}>{label}<span>{value==='todos'?items.length:items.filter(x=>x.status===value).length}</span></button>)}</nav>
    {error&&<StatusMessage type="error" onRetry={load}>{error}</StatusMessage>}
    {loading?<p role="status" className="py-10 text-sm text-muted">Carregando avaliações…</p>:<section aria-label="Avaliações dos leitores" className="grid gap-5">{visible.map(item=><article key={item.id} className="review-card">
      <div className="review-card-top"><div className="min-w-0"><p className="mb-2 text-[10px] uppercase tracking-widest text-muted">Uma leitura, uma opinião</p><h2 className="wrap-anywhere font-display text-2xl">{item.livro?.titulo||'Livro indisponível'}</h2></div><span className={`review-status review-status-${item.status}`}>{statuses[item.status]||item.status}</span></div>
      <div className="flex flex-wrap items-center gap-3"><RatingStars value={item.nota}/><span className="text-xs text-muted">{item.nota} de 5</span></div>
      <p className="wrap-anywhere py-2 text-base leading-relaxed">{item.comentario}</p>
      <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-soft text-sm font-semibold">{item.usuario?.nome?.[0]||'L'}</span><div className="min-w-0"><p className="wrap-anywhere text-sm font-medium">{item.usuario?.nome||'Leitor'}</p><p className="wrap-anywhere text-xs text-muted">{item.usuario?.email}</p></div>{item.createdAt&&<time className="ml-auto text-xs text-muted" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</time>}</div>
      <footer className="review-actions"><Button type="button" variant={item.status==='aprovado'?'secondary':'primary'} disabled={busy!==null||item.status==='aprovado'} aria-label="Aprovar avaliação" onClick={()=>moderate(item,'aprovado')}><Check size={16} aria-hidden="true"/>{item.status==='aprovado'?'Aprovada':'Aprovar'}</Button><Button type="button" variant="ghost" disabled={busy!==null||item.status==='oculto'} aria-label="Ocultar avaliação" onClick={()=>moderate(item,'oculto')}><EyeOff size={16} aria-hidden="true"/>Ocultar</Button><button type="button" disabled={busy!==null} aria-label="Excluir avaliação" className="review-delete" onClick={()=>remove(item)}><Trash2 size={16} aria-hidden="true"/>Excluir</button></footer>
    </article>)}{!visible.length&&<div className="rounded-xl border border-dashed border-stroke px-6 py-12 text-center text-muted"><MessageSquare size={28} className="mx-auto mb-4" aria-hidden="true"/><p>Nenhuma avaliação nesta categoria.</p></div>}</section>}
  </main>;
}
