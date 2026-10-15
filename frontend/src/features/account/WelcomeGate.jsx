import {useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from '../../context/auth.js';
import api from '../../api/api.js';
import './welcome.css';
function WelcomeAccount({usuario}){
  const [visible,setVisible]=useState(false),claim=useRef(null);
  const close=useCallback(()=>setVisible(false),[]);
  useEffect(()=>{
    if(usuario.welcomeSeenAt!==null||usuario.role==='ADMIN')return;
    let active=true;
    claim.current??=api.post('/me/welcome/claim');
    claim.current.then(({data})=>{if(active&&data.show)setVisible(true);}).catch(()=>{});
    return()=>{active=false;};
  },[usuario.welcomeSeenAt,usuario.role]);
  return visible?<WelcomeCurtain onClose={close}/>:null;
}
export default function WelcomeGate(){const {usuario}=useAuth();return usuario?<WelcomeAccount key={usuario.id} usuario={usuario}/>:null;}
function WelcomeCurtain({onClose}){
  const dialog=useRef(null);
  useEffect(()=>{
    const node=dialog.current,media=matchMedia('(prefers-reduced-motion: reduce)');
    if(media.matches){onClose();return;}
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';node.showModal();
    const finish=()=>onClose(),cancel=event=>{event.preventDefault();finish();};
    const onChange=event=>{if(event.matches)finish();};
    node.addEventListener('cancel',cancel);media.addEventListener('change',onChange);
    const timer=setTimeout(finish,3800);
    return()=>{clearTimeout(timer);node.removeEventListener('cancel',cancel);media.removeEventListener('change',onChange);document.body.style.overflow=previous;node.close();};
  },[onClose]);
  return <dialog ref={dialog} className="bc-welcome" aria-label="Boas-vindas ao BiblioConnect"><div className="bc-welcome-stage" aria-hidden="true">{['Bem-vindo.','BiblioConnect.','Sua próxima leitura.','Começa aqui.'].map(word=><span key={word}>{word}</span>)}</div><button className="bc-welcome-skip" type="button" onClick={onClose}>Pular apresentação ↗</button></dialog>;
}
