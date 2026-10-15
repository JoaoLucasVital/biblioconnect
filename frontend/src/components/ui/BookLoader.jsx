import {useContext,useEffect,useId} from "react";
import {LoadingContext} from "./loading-context.js";
import {LoadingMark} from "./loading-mark.jsx";
export default function BookLoader({label="Carregando acervo…"}){
  const register=useContext(LoadingContext),id=useId();
  useEffect(()=>register?.(id,label),[register,id,label]);
  return register?<div className="min-h-32" aria-hidden="true"/>:<LoadingMark label={label}/>;
}
