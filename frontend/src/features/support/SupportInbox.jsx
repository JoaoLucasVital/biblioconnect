import {useCallback,useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,CheckCheck,Inbox,MessageCircle,RefreshCw,Search,Send} from 'lucide-react';
import api from '../../api/api.js';
import {AnimatedHeading,ShinyText} from '../../components/motion/TextAnimations.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import './support-inbox.css';

const filters=[['todas','Todas'],['aberta','Abertas'],['encerrada','Encerradas']];
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const initials=name=>{const parts=(name||'Leitor').trim().split(/\s+/);return (parts.length>1?[parts[0],parts.at(-1)]:parts).map(part=>part[0]).join('');};
function dateValue(value){const date=new Date(value);return value&&!Number.isNaN(date.getTime())?date:null;}
function time(value){return dateValue(value)?.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})||'';}
function day(value){return dateValue(value)?.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})||'';}
function ConversationRow({conversation,selected,onSelect}){
  const latest=conversation.mensagens?.[0],name=conversation.usuario?.nome||'Leitor';
  return <button type="button" className={`bc-inbox-row${selected?' is-selected':''}`} aria-pressed={selected} onClick={onSelect}>
    <span className="bc-inbox-avatar" aria-hidden="true">{initials(name)}</span>
    <span className="bc-inbox-row-content"><strong title={name}>{name}</strong><span className="bc-inbox-preview">{latest?.texto||'Sem mensagens'}</span><span className={`bc-inbox-status ${conversation.status==='aberta'?'is-open':''}`}>{conversation.status==='aberta'?'Aberta':'Encerrada'}</span></span>
    <time dateTime={latest?.createdAt||conversation.updatedAt}>{time(latest?.createdAt||conversation.updatedAt)}</time>
  </button>;
}

export default function SupportInbox(){
  const [conversations,setConversations]=useState([]),[selected,setSelected]=useState(null),[activeId,setActiveId]=useState(null);
  const [query,setQuery]=useState(''),[filter,setFilter]=useState('todas'),[drafts,setDrafts]=useState({});
  const [listLoading,setListLoading]=useState(true),[threadLoading,setThreadLoading]=useState(false),[busy,setBusy]=useState(false);
  const [listError,setListError]=useState(''),[threadError,setThreadError]=useState(''),[actionError,setActionError]=useState('');
  const lifetime=useRef(null),active=useRef(null),threadRequest=useRef(0),listRequest=useRef(0);
  const log=useRef(null),pinned=useRef(true),returnFocus=useRef(null),threadPanel=useRef(null);
  const loadList=useCallback(async()=>{
    const signal=lifetime.current?.signal,ticket=++listRequest.current;
    try{
      const response=await api.get('/admin/chat/conversas',{signal});
      if(!signal?.aborted&&ticket===listRequest.current){setConversations(response.data||[]);setListError('');}
    }catch(error){if(!signal?.aborted&&ticket===listRequest.current)setListError(error.response?.data?.erro||'Erro ao carregar conversas.');}
    finally{if(!signal?.aborted&&ticket===listRequest.current)setListLoading(false);}
  },[]);
  const loadThread=useCallback(async id=>{
    const signal=lifetime.current?.signal,ticket=++threadRequest.current;
    try{
      const response=await api.get(`/admin/chat/conversas/${id}`,{signal});
      if(!signal?.aborted&&ticket===threadRequest.current&&active.current===id){setSelected(response.data);setThreadError('');}
    }catch(error){if(!signal?.aborted&&ticket===threadRequest.current&&active.current===id)setThreadError(error.response?.data?.erro||'Erro ao abrir conversa.');}
    finally{if(!signal?.aborted&&ticket===threadRequest.current&&active.current===id)setThreadLoading(false);}
  },[]);
  useEffect(()=>{
    const controller=new AbortController();lifetime.current=controller;
    async function refresh(){await loadList();const id=active.current;if(!controller.signal.aborted&&id!==null)await loadThread(id);}
    void refresh();const timer=setInterval(refresh,8000);
    return()=>{controller.abort();clearInterval(timer);};
  },[loadList,loadThread]);
  const lastMessage=selected?.mensagens?.at(-1)?.id;
  useEffect(()=>{if(log.current&&pinned.current)log.current.scrollTop=log.current.scrollHeight;},[selected?.id,lastMessage]);
  useEffect(()=>{
    const node=log.current;if(!node||typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(()=>{if(pinned.current)node.scrollTop=node.scrollHeight;});
    observer.observe(node);return()=>observer.disconnect();
  },[selected?.id]);
  useEffect(()=>{
    if(activeId===null)return;
    const button=threadPanel.current?.querySelector('.bc-inbox-back');
    if(button?.getClientRects().length)button.focus({preventScroll:true});
  },[activeId,selected?.id]);

  function selectConversation(id,event){
    returnFocus.current=event.currentTarget;active.current=id;pinned.current=true;
    setActiveId(id);setSelected(null);setThreadError('');setActionError('');setThreadLoading(true);void loadThread(id);
  }
  function back(){
    active.current=null;++threadRequest.current;setActiveId(null);setSelected(null);setThreadLoading(false);setThreadError('');setActionError('');
    requestAnimationFrame(()=>returnFocus.current?.focus({preventScroll:true}));
  }
  async function refresh(){await loadList();if(active.current!==null)await loadThread(active.current);}
  async function reply(event){
    event.preventDefault();const id=active.current,text=(drafts[id]||'').trim();
    if(!selected||selected.status!=='aberta'||!text||busy)return;
    const signal=lifetime.current?.signal;setBusy(true);setActionError('');
    try{
      await api.post(`/admin/chat/conversas/${id}/mensagens`,{texto:text},{signal});
      if(signal?.aborted)return;
      setDrafts(current=>({...current,[id]:''}));
      if(active.current===id){pinned.current=true;await loadThread(id);}
      await loadList();
    }catch(error){if(!signal?.aborted&&active.current===id)setActionError(error.response?.data?.erro||'Erro ao responder. Sua mensagem continua no campo.');}
    finally{if(!signal?.aborted)setBusy(false);}
  }
  async function closeConversation(){
    const id=active.current;if(!selected||busy)return;
    const signal=lifetime.current?.signal;setBusy(true);setActionError('');
    try{
      await api.patch(`/admin/chat/conversas/${id}/status`,{status:'encerrada'},{signal});
      if(signal?.aborted)return;
      if(active.current===id){++threadRequest.current;setSelected(current=>current?.id===id?{...current,status:'encerrada'}:current);}
      await loadList();
    }catch(error){if(!signal?.aborted&&active.current===id)setActionError(error.response?.data?.erro||'Erro ao encerrar.');}
    finally{if(!signal?.aborted)setBusy(false);}
  }
  const visible=conversations.filter(conversation=>{
    if(filter!=='todas'&&conversation.status!==filter)return false;
    return normalize([conversation.usuario?.nome,conversation.usuario?.email,conversation.mensagens?.[0]?.texto].join(' ')).includes(normalize(query.trim()));
  });
  const name=selected?.usuario?.nome||'Leitor',draft=drafts[activeId]||'';
  return <main className="bc-inbox-page">
    <header className="bc-inbox-page-header">
      <div><nav className="bc-inbox-breadcrumb" aria-label="Localização"><Link to="/admin">Administração</Link><span aria-hidden="true">/</span><span>Atendimento</span></nav><AnimatedHeading>Atendimentos<span className="bc-inbox-title-dot">.</span></AnimatedHeading><p>Um espaço para ouvir, orientar e resolver.</p></div>
      <Button variant="secondary" onClick={refresh}><RefreshCw size={15} aria-hidden="true"/>Atualizar</Button>
    </header>
    <div className="bc-inbox-shell" data-conversation-open={activeId!==null?'true':'false'}>
      <aside className="bc-inbox-list" aria-label="Caixa de entrada">
        <div className="bc-inbox-list-controls"><div className="bc-inbox-list-title"><h2><ShinyText>Conversas</ShinyText></h2><span aria-label={`${conversations.length} conversas`}>{conversations.length}</span></div>
          <Field label="Buscar conversas" leading={<Search size={16}/>}><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nome, e-mail ou mensagem"/></Field>
          <div className="bc-inbox-filters" role="group" aria-label="Filtrar conversas">{filters.map(([value,label])=><button key={value} type="button" aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}<span>{value==='todas'?conversations.length:conversations.filter(item=>item.status===value).length}</span></button>)}</div>
        </div>
        {listError&&<StatusMessage type="error" onRetry={loadList}>{listError}</StatusMessage>}
        <div className="bc-inbox-rows" aria-busy={listLoading}>
          {listLoading?<p className="bc-inbox-loading" role="status">Carregando conversas…</p>:visible.length?visible.map(conversation=><ConversationRow key={conversation.id} conversation={conversation} selected={conversation.id===activeId} onSelect={event=>selectConversation(conversation.id,event)}/>):<div className="bc-inbox-list-empty"><Inbox size={24} strokeWidth={1.4} aria-hidden="true"/><p>{conversations.length?'Nenhuma conversa encontrada.':'Sua caixa de entrada está tranquila.'}</p><small>{conversations.length?'Tente outro nome ou filtro.':'As mensagens dos leitores aparecerão aqui.'}</small></div>}
        </div>
      </aside>
      <section ref={threadPanel} className="bc-inbox-thread" aria-label={selected?`Conversa com ${name}`:'Conversa selecionada'} aria-busy={threadLoading}>
        {!selected?<div className="bc-inbox-thread-empty"><button type="button" className="bc-inbox-back" onClick={back}><ArrowLeft size={17} aria-hidden="true"/>Voltar à lista</button>{threadLoading?<p role="status">Abrindo conversa…</p>:threadError?<StatusMessage type="error" onRetry={()=>loadThread(activeId)}>{threadError}</StatusMessage>:<div><span className="bc-inbox-empty-symbol"><MessageCircle size={32} strokeWidth={1.2} aria-hidden="true"/></span><h2>Cada conversa merece atenção.</h2><p>Escolha um leitor ao lado para acompanhar o histórico e continuar o atendimento.</p></div>}</div>:<>
          <header className="bc-inbox-thread-header"><button type="button" className="bc-inbox-back" onClick={back}><ArrowLeft size={17} aria-hidden="true"/>Voltar à lista</button><span className="bc-inbox-avatar" aria-hidden="true">{initials(name)}</span><div className="bc-inbox-person"><h2>{name}</h2><p title={selected.usuario?.email}>{selected.usuario?.email}</p><span className={`bc-inbox-status ${selected.status==='aberta'?'is-open':''}`}>{selected.status==='aberta'?'Conversa aberta':'Conversa encerrada'}</span></div>{selected.status==='aberta'&&<Button onClick={closeConversation} disabled={busy} variant="ghost"><CheckCheck size={16} aria-hidden="true"/>Encerrar</Button>}</header>
          <div ref={log} className="bc-inbox-messages" role="log" aria-label="Mensagens da conversa" aria-live="polite" aria-relevant="additions text" onScroll={event=>{const node=event.currentTarget;pinned.current=node.scrollHeight-node.scrollTop-node.clientHeight<64;}}>
            {!selected.mensagens?.length&&<p className="bc-inbox-loading">Esta conversa ainda não tem mensagens.</p>}
            {selected.mensagens?.map((message,index,messages)=>{
              const team=(message.remetenteRole||message.remetente?.role)==='ADMIN',date=day(message.createdAt),previousDate=index?day(messages[index-1].createdAt):null;
              return <div key={message.id} className="bc-inbox-message-group">{date!==previousDate&&<p className="bc-inbox-date">{date}</p>}<article className={`bc-inbox-bubble ${team?'is-team':'is-reader'}`}><strong>{team?'Equipe BiblioConnect':message.remetente?.nome||name}</strong><p>{message.texto}</p><time dateTime={message.createdAt} title={date}>{time(message.createdAt)}</time></article></div>;
            })}
          </div>
          <footer className="bc-inbox-composer">
            {(actionError||threadError)&&<StatusMessage type="error">{actionError||threadError}</StatusMessage>}
            {selected.status==='aberta'?<form onSubmit={reply}><Field label="Resposta ao cliente"><textarea rows={2} maxLength={2000} disabled={busy} value={draft} onChange={event=>setDrafts(current=>({...current,[activeId]:event.target.value}))} placeholder="Escreva sua resposta…" required/></Field><div className="bc-inbox-compose-actions"><small>{draft.length}/2000</small><Button className="bc-inbox-send" type="submit" disabled={busy||!draft.trim()} busy={busy}><span>{busy?'Enviando…':'Responder'}</span><Send size={17} aria-hidden="true"/></Button></div></form>:<p className="bc-inbox-closed"><CheckCheck size={18} aria-hidden="true"/>Esta conversa foi encerrada. O histórico continua disponível.</p>}
          </footer>
        </>}
      </section>
    </div>
  </main>;
}
