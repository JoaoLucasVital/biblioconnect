import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import api from "../../api/api.js";
import BrandLogo from "../../components/BrandLogo.jsx";
import BookCover from "../../components/ui/BookCover.jsx";
import "./auth-shell.css";
import {AnimatedHeading} from '../../components/motion/TextAnimations.jsx';

export default function AuthShell({children,wide=false}){
  const [books,setBooks]=useState([]);
  useEffect(()=>{
    const controller=new AbortController();
    async function load(){
      try{const {data}=await api.get("/livros",{signal:controller.signal});
        if(!controller.signal.aborted&&Array.isArray(data))setBooks(data.filter(book=>book.imagemUrl).sort((a,b)=>Number(Boolean(b.destaque))-Number(Boolean(a.destaque))).slice(0,3));
      }catch{/* The account form remains available if catalog artwork cannot load. */}
    }
    load();return()=>controller.abort();
  },[]);
  return <main className={`bc-auth-shell ${wide?"bc-auth-shell--wide":""}`}>
    <aside className="bc-auth-story" aria-label="Sua próxima leitura">
      <Link to="/" className="bc-auth-brand"><BrandLogo className="h-8 w-12"/><span>BiblioConnect</span></Link>
      <div className="bc-auth-story-copy"><span className="bc-auth-kicker">UM ENCONTRO ENTRE CAPÍTULOS</span><AnimatedHeading as="p">Algumas histórias<br/>começam com<br/><em>você.</em></AnimatedHeading><span className="bc-auth-rule"/></div>
      {books.length>0&&<div className="bc-auth-covers" aria-label="Livros do nosso acervo">{books.map((book,index)=><div className="bc-auth-cover" key={book.id} style={{"--cover-index":index}}><BookCover livro={book} sizes="(min-width: 1024px) 180px, 100px"/></div>)}</div>}
      <div className="bc-auth-colophon"><span>SUA BIBLIOTECA. SEU RITMO.</span><span>Compre · Alugue · Reserve</span></div>
    </aside>
    <div className="bc-auth-form">{children}</div>
  </main>;
}
