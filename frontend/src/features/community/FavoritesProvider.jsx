import {useEffect} from "react";
import {useAuth} from "../../context/auth.js";
import {favoritesStore} from "./favorites-client.js";
export default function FavoritesProvider({children}){
  const {usuario}=useAuth();
  useEffect(()=>{favoritesStore.setUser(usuario?.id||null);return()=>favoritesStore.stop();},[usuario?.id]);
  return children;
}
