import {AnimatedHeading} from '../components/motion/TextAnimations.jsx';
import {useEffect,useRef,useState} from "react";
import {Link,useNavigate,useParams} from "react-router-dom";
import {ArrowLeft,ArrowRight,BookOpen,MapPin,Package,Truck} from "lucide-react";
import {useAuth} from "../context/auth.js";
import api from "../api/api.js";
import BookCover from "../components/ui/BookCover.jsx";
import BookLoader from "../components/ui/BookLoader.jsx";
import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import FadeInput from "../components/ui/FadeInput.jsx";
import HoldButton from "../components/ui/HoldButton.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import {formatarMoeda} from "../features/catalog/format.js";

const digits=value=>String(value||"").replace(/\D/g,"").slice(0,8);
const formatCep=value=>{const cep=digits(value);return cep.length>5?`${cep.slice(0,5)}-${cep.slice(5)}`:cep;};
const addressKeys=["cep","rua","numero","bairro","cidade","estado","complemento"];
const addressFrom=user=>Object.fromEntries(addressKeys.map(key=>[key,key==="cep"?formatCep(user?.[key]):user?.[key]||""]));
const routeAddress=form=>[form.rua,form.numero,form.complemento,form.bairro,form.cidade,form.estado,form.cep,"Brasil"].filter(Boolean).map(value=>value.trim()).filter(Boolean).join(", ");
const validAddress=form=>digits(form.cep).length===8&&["rua","numero","cidade","estado"].every(key=>form[key].trim())&&/^[A-Z]{2}$/.test(form.estado);

export default function Checkout(){
  const {livroId}=useParams();
  return <CheckoutContent key={livroId} livroId={livroId}/>;
}
function CheckoutContent({livroId}){
  const {usuario}=useAuth(),navigate=useNavigate();
  const [livro,setLivro]=useState(null),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState("");
  const [modalidade,setModalidade]=useState("retirada"),[form,setForm]=useState(()=>addressFrom(usuario));
  const [quote,setQuote]=useState(null),[quoting,setQuoting]=useState(false),[buying,setBuying]=useState(false),[error,setError]=useState("");
  const [cepLoading,setCepLoading]=useState(false),[cepMessage,setCepMessage]=useState(""),[cepAttempt,setCepAttempt]=useState(0);
  const mounted=useRef(false),locked=useRef(false);
  const busy=buying||quoting;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{
    let active=true;
    api.get(`/livros/${livroId}`).then(({data})=>{if(active)setLivro(data);}).catch(failure=>{if(active)setLoadError(failure.response?.data?.erro||"Não foi possível carregar este livro.");}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[livroId]);
  const cep=digits(form.cep);
  useEffect(()=>{
    if(modalidade!=="entrega"||cep.length!==8)return;
    const controller=new AbortController();let active=true,timeout;
    const timer=setTimeout(async()=>{
      setCepLoading(true);setCepMessage("");timeout=setTimeout(()=>controller.abort(),10000);
      try{
        const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`,{signal:controller.signal});
        if(!response.ok)throw Error("unavailable");const data=await response.json();
        if(!active)return;
        if(data.erro){setCepMessage("CEP não encontrado. Confira os números ou preencha o endereço manualmente.");return;}
        if(typeof data.localidade!=="string"||typeof data.uf!=="string")throw Error("invalid");
        setForm(previous=>({...previous,rua:data.logradouro||"",bairro:data.bairro||"",cidade:data.localidade,estado:data.uf.toUpperCase()}));setQuote(null);
        setCepMessage(data.logradouro?"Endereço encontrado. Confira e complete o número.":"CEP encontrado. Complete a rua e o número para continuar.");
      }catch{if(active)setCepMessage("Não foi possível consultar o CEP. Preencha o endereço manualmente.");}
      finally{clearTimeout(timeout);if(active)setCepLoading(false);}
    },250);
    return()=>{active=false;clearTimeout(timer);clearTimeout(timeout);controller.abort();};
  },[cep,modalidade,cepAttempt]);
  function change(key,value){
    setQuote(null);setError("");
    if(key==="cep"){value=formatCep(value);setCepLoading(digits(value).length===8);setCepMessage("");}
    if(key==="estado")value=value.toUpperCase().replace(/[^A-Z]/g,"").slice(0,2);
    setForm(previous=>({...previous,[key]:value}));
  }
  function changeMode(value){setModalidade(value);setQuote(null);setError("");setCepLoading(value==="entrega"&&cep.length===8);}
  async function calculate(){
    if(busy||cepLoading||!validAddress(form))return;
    setQuoting(true);setError("");setQuote(null);
    try{const {data}=await api.post("/entrega/cotacao",{endereco:routeAddress(form)});if(mounted.current)setQuote(data);}
    catch(failure){if(mounted.current)setError(failure.response?.data?.erro||"Não foi possível calcular o frete. Seus dados foram preservados.");}
    finally{if(mounted.current)setQuoting(false);}
  }
  async function confirm(){
    if(locked.current||busy||Number(livro?.estoque)<=0||(modalidade==="entrega"&&(!quote||!validAddress(form)||cepLoading)))return;
    locked.current=true;setBuying(true);setError("");
    try{
      const endereco=routeAddress(form);
      const {data}=await api.post("/comprar",{livroId:Number(livroId),modalidadeEntrega:modalidade,enderecoEntrega:modalidade==="entrega"?endereco:undefined});
      if(mounted.current)navigate(`/pedido-confirmado/${data.id}`);
    }catch(failure){if(mounted.current)setError(failure.response?.data?.erro||"Não foi possível confirmar. Confira os dados e tente novamente.");}
    finally{locked.current=false;if(mounted.current)setBuying(false);}
  }
  if(loading)return <main className="mx-auto max-w-7xl px-5 py-16"><BookLoader label="Preparando seu checkout…"/></main>;
  if(loadError||!livro)return <main className="mx-auto max-w-7xl px-5 py-16"><StatusMessage type="error">{loadError||"Livro não encontrado."}</StatusMessage><Link className="mt-6 inline-flex min-h-11 items-center underline" to="/livros">Voltar ao catálogo</Link></main>;
  const delivery=modalidade==="entrega",freight=delivery?Number(quote?.valorEntrega||0):0;
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
    <Link to="/livros#catalogo" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true"/>Voltar ao acervo</Link>
    <header className="mb-10 border-b border-stroke pb-8"><p className="text-xs uppercase tracking-[0.18em] text-muted">BIBLIOCONNECT / CHECKOUT</p><AnimatedHeading className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Finalize sua leitura.</AnimatedHeading><p className="mt-3 text-sm leading-relaxed text-muted">Seu livro está escolhido. Agora, como ele chega até você?</p><ol aria-label="Etapas da compra" className="mt-7 flex flex-wrap items-center gap-4 text-xs"><li className="font-semibold text-ink" aria-current="step">01 · Recebimento e revisão</li><ArrowRight size={14} className="text-muted" aria-hidden="true"/><li className="text-muted">02 · Pagamento</li></ol></header>
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:gap-16">
      <form onSubmit={event=>event.preventDefault()} className="grid min-w-0 gap-8">
        <fieldset disabled={busy} className="grid min-w-0 gap-3 border-0 p-0"><legend className="mb-5 font-display text-2xl">Como deseja receber?</legend>
          {[["retirada","Buscar na biblioteca","Sem frete. Retire em até 7 dias.",Package],["entrega","Receber em casa","Preencha o CEP e confira o frete.",Truck]].map(([value,title,description,Icon])=><label key={value} className={`flex cursor-pointer items-center gap-4 rounded-lg border p-5 transition-colors ${modalidade===value?"border-accent bg-soft":"border-stroke hover:bg-soft"}`}><input type="radio" name="recebimento" value={value} checked={modalidade===value} onChange={()=>changeMode(value)} className="accent-accent"/><Icon size={21} className="shrink-0 text-muted" aria-hidden="true"/><span className="text-sm"><strong className="block font-semibold">{title}</strong><span className="mt-1 block text-muted">{description}</span></span></label>)}
        </fieldset>
        {delivery?<fieldset disabled={busy} className="grid min-w-0 gap-5 border-t border-stroke pt-7"><legend className="px-0 font-display text-2xl">Seu endereço</legend>
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]"><Field label="CEP" hint="O endereço é preenchido automaticamente."><FadeInput value={form.cep} onChange={event=>change("cep",event.target.value)} autoComplete="postal-code" inputMode="numeric" placeholder="00000-000" maxLength={9}/></Field><Button variant="ghost" disabled={cepLoading||cep.length!==8} onClick={()=>{setCepLoading(true);setCepAttempt(value=>value+1);}}>{cepLoading?"Buscando endereço…":"Buscar CEP"}</Button></div>
          {cepMessage&&<p role="status" className="text-xs leading-relaxed text-muted">{cepMessage}</p>}
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_120px]"><Field label="Rua / Avenida"><FadeInput disabled={cepLoading} value={form.rua} onChange={event=>change("rua",event.target.value)} autoComplete="address-line1" maxLength={200}/></Field><Field label="Número"><FadeInput value={form.numero} onChange={event=>change("numero",event.target.value)} maxLength={20}/></Field></div>
          <Field label="Bairro"><FadeInput disabled={cepLoading} value={form.bairro} onChange={event=>change("bairro",event.target.value)} maxLength={100}/></Field>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_120px]"><Field label="Cidade"><FadeInput disabled={cepLoading} value={form.cidade} onChange={event=>change("cidade",event.target.value)} autoComplete="address-level2" maxLength={100}/></Field><Field label="Estado"><FadeInput disabled={cepLoading} value={form.estado} onChange={event=>change("estado",event.target.value)} autoComplete="address-level1" maxLength={2} placeholder="AL"/></Field></div>
          <Field label="Complemento" hint="Opcional: apartamento, bloco ou sala."><FadeInput value={form.complemento} onChange={event=>change("complemento",event.target.value)} autoComplete="address-line2" maxLength={100}/></Field>
          <Button variant="secondary" busy={quoting} disabled={buying||cepLoading||!validAddress(form)} onClick={calculate}><MapPin size={17} aria-hidden="true"/>Calcular frete</Button>
          {quote&&<DeliveryQuote quote={quote}/>}
          <p className="text-xs leading-relaxed text-muted">Alterou o endereço? O frete precisa ser calculado novamente.</p>
        </fieldset>:<div className="flex items-start gap-3 border-t border-stroke pt-6 text-sm text-muted"><MapPin size={19} className="shrink-0" aria-hidden="true"/><p>Retire na biblioteca após a confirmação do pagamento. Os detalhes ficam disponíveis no seu pedido.</p></div>}
      </form>
      <aside aria-label="Resumo da compra" className="grid min-w-0 gap-6 rounded-xl border border-stroke bg-surface p-6 sm:p-8 lg:sticky lg:top-28">
        <div className="flex items-center justify-between gap-3"><h2 className="font-display text-2xl">Sua escolha</h2><BookOpen size={20} className="text-muted" aria-hidden="true"/></div>
        <div className="flex items-center gap-5"><BookCover livro={livro} className="w-24 shrink-0 rounded-sm shadow-lg"/><div className="min-w-0"><p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted">{livro.categoria}</p><h3 className="wrap-anywhere font-display text-xl leading-snug">{livro.titulo}</h3><p className="mt-2 text-sm text-muted">{livro.autor}</p><p className="mt-3 text-xs text-muted">1 exemplar · Compra</p></div></div>
        <dl className="grid gap-4 border-y border-stroke py-5 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Livro</dt><dd>{formatarMoeda(livro.precoCompra)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">{delivery?"Entrega":"Retirada"}</dt><dd>{delivery?(quote?formatarMoeda(freight):"A calcular"):<span className="font-medium">Grátis</span>}</dd></div></dl>
        <div className="flex items-end justify-between gap-3"><p className="text-sm">{delivery&&!quote?"Subtotal":"Total"}</p><strong className="text-3xl font-semibold tracking-tight tabular-nums">{formatarMoeda(Number(livro.precoCompra)+freight)}</strong></div>
        {delivery&&!quote&&<p className="text-xs text-muted">Calcule o frete para conferir o valor final.</p>}
        {Number(livro.estoque)<=0&&<StatusMessage type="error">Este livro está sem estoque. Volte ao acervo para escolher outra leitura.</StatusMessage>}
        {error&&<StatusMessage type="error">{error}</StatusMessage>}
        <HoldButton busy={buying} disabled={quoting||Number(livro.estoque)<=0||(delivery&&(!quote||!validAddress(form)||cepLoading))} onConfirm={confirm}>Confirmar compra</HoldButton>
        <p className="text-center text-xs leading-relaxed text-muted">Ao confirmar, seu pedido será criado e você seguirá para o pagamento.</p>
      </aside>
    </div>
  </main>;
}

function DeliveryQuote({quote}){
  return <div className="grid gap-2 rounded-lg border border-stroke bg-soft p-4 text-sm"><p className="font-medium">Frete calculado · {formatarMoeda(quote.valorEntrega)}</p><span>Distância: {quote.distanciaKm} km</span>{quote.destinoEncontrado&&<p className="text-xs text-muted">Destino localizado: {quote.destinoEncontrado}</p>}{quote.localizacaoAproximada&&<p className="text-xs leading-relaxed text-muted">Estimativa até a rua: o mapa não localizou o número exato na origem ou no destino.</p>}{quote.provedor==="openrouteservice"&&<p className="text-[11px] leading-relaxed text-muted">© <a className="underline underline-offset-2" href="https://openrouteservice.org/" target="_blank" rel="noreferrer">openrouteservice by HeiGIT</a> · Dados <a className="underline underline-offset-2" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a className="underline underline-offset-2" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a></p>}</div>;
}
