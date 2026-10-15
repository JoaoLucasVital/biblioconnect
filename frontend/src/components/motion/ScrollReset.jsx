import {useLayoutEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {useAuth} from '../../context/auth.js';
export default function ScrollReset(){
  const {pathname,search}=useLocation(),{usuario}=useAuth();
  useLayoutEffect(()=>{const previous=history.scrollRestoration;history.scrollRestoration='manual';return()=>{history.scrollRestoration=previous;};},[]);
  useLayoutEffect(()=>{window.scrollTo({top:0,left:0,behavior:'instant'});},[pathname,search,usuario?.id]);
  return null;
}
