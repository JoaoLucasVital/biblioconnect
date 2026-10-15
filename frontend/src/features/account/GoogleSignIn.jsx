import {useEffect,useRef,useState,useSyncExternalStore} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../api/api.js";
import {useAuth} from "../../context/auth.js";
import Button from "../../components/ui/Button.jsx";
import StatusMessage from "../../components/ui/StatusMessage.jsx";
import "./google-sign-in.css";

let scriptPromise;
const getDarkTheme=()=>document.body.classList.contains("dark");
function subscribeTheme(listener){const observer=new MutationObserver(listener);observer.observe(document.body,{attributes:true,attributeFilter:["class"]});return()=>observer.disconnect();}
function loadGoogle(){
  if(window.google?.accounts?.id)return Promise.resolve(window.google.accounts.id);
  if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement("script");script.src="https://accounts.google.com/gsi/client";script.async=true;
    script.onload=()=>window.google?.accounts?.id?resolve(window.google.accounts.id):reject(new Error("Google indisponível"));
    script.onerror=()=>{scriptPromise=null;script.remove();reject(new Error("Google indisponível"));};document.head.append(script);
  });
  return scriptPromise;
}
export default function GoogleSignIn({lembrar=false,link=false}){
  const {acceptSession}=useAuth(),navigate=useNavigate(),container=useRef(null);
  const [state,setState]=useState("loading"),[error,setError]=useState(""),[attempt,setAttempt]=useState(0);
  const dark=useSyncExternalStore(subscribeTheme,getDarkTheme,getDarkTheme);
  useEffect(()=>{
    let active=true;
    async function prepare(){
      try{
        const {data:config}=await api.get("/auth/config");
        if(!active)return;
        if(!config.googleEnabled){setState("unavailable");return;}
        const gis=await loadGoogle();
        if(!active)return;
        const {data:challenge}=await api.post("/auth/google/challenge",{lembrar});
        if(!active)return;
        gis.initialize({client_id:config.googleClientId,nonce:challenge.nonce,auto_select:false,callback:async({credential})=>{
          if(!active)return;
          setState("busy");setError("");
          try{
            const {data}=await api.post(link?"/auth/google/link":"/auth/google",{credential,challengeId:challenge.challengeId,nonce:challenge.nonce});
            if(!active)return;
            acceptSession(data);navigate(link?"/perfil":"/");
          }catch(failure){if(active){setError(failure.response?.data?.erro||"Não foi possível continuar com Google.");setState("error");}}
        }});
        container.current.replaceChildren();
        gis.renderButton(container.current,{theme:dark?"filled_black":"outline",size:"large",type:"standard",text:"continue_with",shape:"pill",locale:"pt_BR",width:Math.min(400,container.current.parentElement.clientWidth||320)});
        setState("ready");
      }catch{if(active){setError("Não foi possível carregar o login Google.");setState("error");}}
    }
    prepare();return()=>{active=false;};
  },[acceptSession,navigate,lembrar,link,attempt,dark]);
  return <div className="mt-6 grid gap-3">
    <div className="flex items-center gap-4 text-xs text-muted"><span className="h-px flex-1 bg-stroke"/>ou continue com<span className="h-px flex-1 bg-stroke"/></div>
    <div ref={container} className={`bc-google-button ${state==="ready"?"":"hidden"}`}/>
    {state!=="ready"&&<Button type="button" variant="secondary" disabled={state!=="error"} onClick={()=>{setError("");setAttempt(value=>value+1);}} className="w-full">{state==="busy"?"Conectando…":state==="error"?"Tentar Google novamente":"Continuar com Google"}</Button>}
    {state==="unavailable"&&<p className="text-center text-xs text-muted">Login Google será liberado após a configuração da biblioteca.</p>}
    {error&&<StatusMessage type="error">{error}</StatusMessage>}
  </div>;
}
