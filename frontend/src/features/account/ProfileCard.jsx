import ReactBitsProfileCard from "./vendor/ProfileCard.jsx";
import useMediaQuery from "../home/useMediaQuery.js";
import "./profile-card.css";
const apiBase=import.meta.env.VITE_API_URL||"http://localhost:3000";
export default function ProfileCard({usuario}){
  const reduced=useMediaQuery("(prefers-reduced-motion: reduce)"),fine=useMediaQuery("(hover: hover) and (pointer: fine)");
  const avatar=usuario.avatarUrl?`${apiBase.replace(/\/$/,"")}${usuario.avatarUrl}`:"";
  return <div className={`bc-reader-card${avatar?" bc-reader-card--photo":""}`}>
    <ReactBitsProfileCard name={usuario.nome} title="Sua biblioteca, seu ritmo." handle={`BC-${String(usuario.id).padStart(5,"0")}`} status={usuario.role==="ADMIN"?"Equipe da biblioteca":"Cartão de leitor"} statusColor="#e67e00" avatarUrl={avatar} contactText="" theme="dark" backdropColor="#1e3a5f" radius={12} holo={.28} glare={.18} enableTilt={fine&&!reduced} tiltStrength={5} parallax={fine&&!reduced?3:0} enableMobileTilt={false} intro={false}/>
    {!avatar&&<span className="bc-reader-initials" aria-hidden="true">{usuario.nome.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toLocaleUpperCase("pt-BR")}</span>}
  </div>;
}
