import {lazy,Suspense,useEffect,useRef,useState} from "react";
import {Upload,Trash2} from "lucide-react";
import {useAuth} from "../context/auth.js";
import api from "../api/api.js";
import Button from "../components/ui/Button.jsx";
import Field from "../components/ui/Field.jsx";
import FadeInput from "../components/ui/FadeInput.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import ProfileCard from "../features/account/ProfileCard.jsx";
import GoogleSignIn from "../features/account/GoogleSignIn.jsx";
import SavedBooks from "../features/community/SavedBooks.jsx";
const ProfilePhotoEditor=lazy(()=>import("../features/account/ProfilePhotoEditor.jsx"));
const fields=[['nome','Nome completo','name'],['telefone','Telefone','tel'],['cep','CEP','postal-code'],['rua','Rua / Avenida','address-line1'],['numero','Número','off'],['bairro','Bairro','off'],['cidade','Cidade','address-level2'],['estado','Estado','address-level1'],['complemento','Complemento','address-line2'],['pontoReferencia','Ponto de referência','off']];
const draft=user=>Object.fromEntries(fields.map(([key])=>[key,user?.[key]||""]));
export default function Profile(){
  const {usuario,updateUser}=useAuth();
  const dirty=useRef(false);
  const [saved,setSaved]=useState(usuario),[form,setForm]=useState(()=>draft(usuario)),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[photoOpen,setPhotoOpen]=useState(false);
  useEffect(()=>{let active=true;api.get("/me").then(({data})=>{if(active){setSaved(data);if(!dirty.current)setForm(draft(data));}}).catch(()=>{if(active)setError("Não foi possível carregar os dados atualizados.");});return()=>{active=false;};},[]);
  function accept(data){setSaved(data);updateUser(data);}
  async function save(event){event.preventDefault();if(busy)return;setBusy(true);setError("");setMessage("");try{const {data}=await api.patch("/me",form);accept(data);dirty.current=false;setForm(draft(data));setMessage("Perfil atualizado.");}catch(failure){setError(failure.response?.data?.erro||"Não foi possível salvar. Seus dados digitados foram preservados.");}finally{setBusy(false);}}
  async function removePhoto(){if(busy)return;setBusy(true);setError("");try{const {data}=await api.delete("/me/foto");accept(data);setMessage("Foto removida.");}catch{setError("Não foi possível remover a foto.");}finally{setBusy(false);}}
  if(!saved)return null;
  return <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
    <header className="mb-10 max-w-2xl"><span className="text-xs uppercase tracking-widest text-muted">SUA CONTA</span><h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Seu lugar entre histórias.</h1><p className="mt-4 text-sm leading-relaxed text-muted">Seu cartão da biblioteca e as informações para acompanhar suas leituras.</p></header>
    <div className="bc-profile-layout"><aside className="grid min-w-0 gap-5"><ProfileCard usuario={saved}/><div className="flex flex-wrap justify-center gap-2"><Button variant="secondary" onClick={()=>setPhotoOpen(true)} disabled={busy}><Upload size={16} aria-hidden="true"/>Importar foto</Button>{saved.avatarUrl&&<Button variant="ghost" onClick={removePhoto} disabled={busy}><Trash2 size={16} aria-hidden="true"/>Remover foto</Button>}</div><p className="mx-auto max-w-xs text-center text-xs leading-relaxed text-muted">A foto é opcional e fica privada na sua conta.</p><GoogleSignIn link/></aside>
    <form onSubmit={save} className="bc-profile-fields"><div className="border-b border-stroke pb-5"><h2 className="font-display text-2xl">Informações pessoais</h2><p className="mt-2 text-sm text-muted">Mantenha seu contato e endereço atualizados para as entregas.</p></div>
      <Field label="Email"><input type="email" value={saved.email} readOnly autoComplete="email"/></Field>
      <div className="grid gap-5 sm:grid-cols-2">{fields.map(([key,label,autoComplete])=><Field key={key} label={label}><FadeInput value={form[key]} onChange={event=>{dirty.current=true;setForm(previous=>({...previous,[key]:event.target.value}));}} autoComplete={autoComplete} maxLength={key==="estado"?2:key==="nome"?120:200} required={key==="nome"}/></Field>)}</div>
      {error&&<StatusMessage type="error">{error}</StatusMessage>}{message&&<StatusMessage type="success">{message}</StatusMessage>}
      <div className="flex justify-end border-t border-stroke pt-5"><Button type="submit" disabled={busy}>{busy?"Salvando…":"Salvar alterações"}</Button></div>
    </form></div>
    {photoOpen&&<Suspense fallback={<p role="status">Abrindo editor de foto…</p>}><ProfilePhotoEditor onClose={()=>setPhotoOpen(false)} onSaved={data=>{accept(data);setMessage("Foto atualizada.");}}/></Suspense>}
    <SavedBooks/>
  </main>;
}
