import {useCallback,useEffect,useState} from 'react';
import {LoadingContext} from './loading-context.js';
import {LoadingMark} from './loading-mark.jsx';
export default function LoadingProvider({children}){
  const [entries,setEntries]=useState(()=>new Map()),[ready,setReady]=useState(false);
  const register=useCallback((key,label)=>{setEntries(current=>new Map(current).set(key,label));return()=>setEntries(current=>{const next=new Map(current);next.delete(key);return next;});},[]);
  const active=entries.size>0;
  useEffect(()=>{if(!active)return;const timer=setTimeout(()=>setReady(true),150);return()=>{clearTimeout(timer);setReady(false);};},[active]);
  return <LoadingContext.Provider value={register}>{children}{active&&ready&&<div className="bc-loading-overlay"><LoadingMark label={[...entries.values()].at(-1)}/></div>}</LoadingContext.Provider>;
}
