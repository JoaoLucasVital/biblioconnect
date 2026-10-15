import {useEffect,useRef,useState} from "react";
import api from "../../api/api.js";
import Dialog from "../../components/ui/Dialog.jsx";
import Button from "../../components/ui/Button.jsx";
import StatusMessage from "../../components/ui/StatusMessage.jsx";
import {processPortrait} from "./portrait-processing.js";

export default function ProfilePhotoEditor({onClose,onSaved}){
  const [photo,setPhoto]=useState(null),[progress,setProgress]=useState(""),[error,setError]=useState(""),[saving,setSaving]=useState(false);
  const controller=useRef(null),url=useRef(null),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();if(url.current)URL.revokeObjectURL(url.current);};},[]);
  function showPreview(blob,original){
    if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(blob);setPhoto({...original,blob,preview:url.current});
  }
  async function choose(event){
    const file=event.target.files?.[0];if(!file)return;
    controller.current?.abort();controller.current=new AbortController();const own=controller.current;
    setPhoto(null);setError("");setProgress("Preparando foto…");
    try{
      const result=await processPortrait(file,{signal:own.signal,onProgress:message=>{if(alive.current&&!own.signal.aborted)setProgress(message);}});
      if(!alive.current||own.signal.aborted)return;showPreview(result.blob,result);setProgress("");
    }catch(failure){if(alive.current&&!own.signal.aborted){setError(failure.message);setProgress("");}}
  }
  async function save(){
    if(!photo||saving||progress)return;setSaving(true);setError("");
    try{const form=new FormData();form.append("foto",photo.blob,"portrait.webp");const {data}=await api.post("/me/foto",form);if(alive.current){onSaved(data);onClose();}}
    catch(failure){if(alive.current)setError(failure.response?.data?.erro||"Não foi possível salvar a foto. A anterior foi preservada.");}
    finally{if(alive.current)setSaving(false);}
  }
  return <Dialog open title="Sua foto no cartão" busy={saving} onClose={onClose} footer={<><Button variant="ghost" disabled={saving} onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={!photo||Boolean(progress)||saving}>{saving?"Salvando…":"Salvar foto"}</Button></>}>
    <p className="text-sm leading-relaxed text-muted">Escolha uma imagem JPG, PNG ou WebP de até 5 MB. O fundo original e a foto inteira serão mantidos. Vamos apenas otimizar o tamanho do arquivo.</p>
    <label className="grid gap-2 text-sm font-medium">Escolher foto<input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={choose} className="min-h-11 w-full text-sm file:mr-4 file:rounded file:border file:border-stroke file:bg-soft file:px-4 file:py-3 file:text-ink"/></label>
    {progress&&<p role="status" className="text-sm text-muted">{progress}</p>}
    {error&&<StatusMessage type="error">{error}</StatusMessage>}
    {photo&&<div className="bc-photo-preview"><img src={photo.preview} alt="Prévia da foto completa com fundo original"/></div>}
  </Dialog>;
}
