import {useNavigate} from "react-router-dom";
import {useAuth} from "../../context/auth.js";
import useFavorites from "./useFavorites.js";
import {favoritesStore} from "./favorites-client.js";
import PulseHeart from "./PulseHeart.jsx";
export default function BookSave({livro,onSaved}){
  const favorite=useFavorites(livro.id),{isAuthenticated}=useAuth(),navigate=useNavigate();
  return <PulseHeart title={livro.titulo} total={favorite.total} saved={favorite.salvo} busy={favorite.pending} error={favorite.error} unavailable={isAuthenticated&&favorite.total===null} onToggle={()=>{if(!isAuthenticated){navigate("/login");return;}favoritesStore.setSaved(livro.id,!favorite.salvo).then(data=>{if(data)onSaved?.();}).catch(()=>{});}}/>;
}
