import {useEffect,useRef,useState} from "react";
import api from "../../api/api.js";
import Dialog from "../../components/ui/Dialog.jsx";
import Button from "../../components/ui/Button.jsx";
import StatusMessage from "../../components/ui/StatusMessage.jsx";
import {processPortrait,cropPortrait} from "./portrait-processing.js";

export default function ProfilePhotoEditor({onClose,onSaved}){
  const [photo,setPhoto]=useState(null),[progress,setProgress]=useState(""),[error,setError]=useState(""),[saving,setSaving]=useState(false);
  const [adjustments,setAdjustments]=useState({zoom:1,x:0,y:0});
  const [adjusting,setAdjusting]=useState(false);
  const controller=useRef(null),url=useRef(null),version=useRef(0),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();if(url.current)URL.revokeObjectURL(url.current);};},[]);
  function showPreview(blob,original){
    if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(blob);setPhoto({...original,blob,preview:url.current});
  }
  async function choose(event){
    const file=event.target.files?.[0];if(!file)return;
    ++version.current;controller.current?.abort();controller.current=new AbortController();const own=controller.current;
    setError("");setProgress("Preparando foto…");setAdjusting(false);setAdjustments({zoom:1,x:0,y:0});
    try{
      const result=await processPortrait(file,{signal:own.signal,onProgress:message=>{if(alive.current&&!own.signal.aborted)setProgress(message);}});
      if(!alive.current||own.signal.aborted)return;showPreview(result.blob,result);setProgress("");
    }catch(failure){if(alive.current&&!own.signal.aborted){setError(failure.message);setProgress("");}}
  }
  async function adjust(key,value){
    const next={...adjustments,[key]:Number(value)},own=++version.current;setAdjustments(next);setAdjusting(true);
    try{const blob=await cropPortrait(photo.sourceBlob,photo.crop,next);if(alive.current&&own===version.current)showPreview(blob,photo);}
    catch{if(alive.current)setError("Não foi possível ajustar o recorte.");}
    finally{if(alive.current&&own===version.current)setAdjusting(false);}
  }
  async function save(){
    if(!photo||saving||progress||adjusting)return;setSaving(true);setError("");
    try{const form=new FormData();form.append("foto",photo.blob,"portrait.webp");const {data}=await api.post("/me/foto",form);if(alive.current){onSaved(data);onClose();}}
    catch(failure){if(alive.current)setError(failure.response?.data?.erro||"Não foi possível salvar a foto. A anterior foi preservada.");}
    finally{if(alive.current)setSaving(false);}
  }
  return <Dialog open title="Sua foto no cartão" busy={saving} onClose={onClose} footer={<><Button variant="ghost" disabled={saving} onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={!photo||Boolean(progress)||saving||adjusting}>{saving?"Salvando…":"Salvar foto"}</Button></>}>
    <p className="text-sm leading-relaxed text-muted">Escolha uma foto de frente, com boa luz e apenas você. O fundo é removido no seu dispositivo. Só a imagem final será salva.</p>
    <label className="grid gap-2 text-sm font-medium">Escolher foto<input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={choose} className="min-h-11 w-full text-sm file:mr-4 file:rounded file:border file:border-stroke file:bg-soft file:px-4 file:py-3 file:text-ink"/></label>
    {progress&&<p role="status" className="text-sm text-muted">{progress}</p>}
    {error&&<StatusMessage type="error">{error}</StatusMessage>}
    {photo&&<><div className="bc-photo-preview"><img src={photo.preview} alt="Prévia da sua foto sem fundo"/></div><div className="grid gap-4">
      {[['zoom','Zoom',1,2.5,.05],['x','Posição horizontal',-1,1,.02],['y','Posição vertical',-1,1,.02]].map(([key,label,min,max,step])=><label key={key} className="grid gap-2 text-sm">{label}<input type="range" min={min} max={max} step={step} value={adjustments[key]} disabled={saving||Boolean(progress)} onChange={event=>adjust(key,event.target.value)}/></label>)}
    </div></>}
  </Dialog>;
}
