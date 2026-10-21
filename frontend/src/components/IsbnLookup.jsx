import { useEffect, useRef, useState } from "react";
import api from "../api/api.js";
import Field from "./ui/Field.jsx";
import Button from "./ui/Button.jsx";

/**
 * Campo reutilizável de ISBN para cadastro/edição.
 * A consulta é feita pelo backend para manter chaves de API fora do navegador.
 */
function IsbnLookup({ value, onChange, onFound }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [source,setSource]=useState(null);
  const sequence=useRef(0),pending=useRef(null),latest=useRef(value);
  latest.current=value;
  useEffect(()=>()=>{sequence.current++;pending.current?.abort();},[]);
  function change(next){sequence.current++;pending.current?.abort();setLoading(false);setFeedback('');setSource(null);onChange(next);}

  async function buscar() {
    if (loading) return;
    const isbn = String(value || "").trim();
    if (!isbn) {
      setFeedback("Informe o ISBN antes de buscar.");
      return;
    }

    const current=++sequence.current,selected=value;
    const controller=new AbortController();pending.current=controller;
    try {
      setLoading(true);
      setFeedback("");
      setSource(null);
      const response = await api.get(`/isbn/${encodeURIComponent(isbn)}`,{signal:controller.signal});
      if(current!==sequence.current||latest.current!==selected)return;
      onFound(response.data);
      const labels={titulo:'título',autor:'autor',redator:'editora',ano:'ano',categoria:'categoria',sinopse:'sinopse',capa:'capa'};
      const missing=(response.data.camposAusentes||[]).map(key=>labels[key]||key);
      setFeedback(missing.length?`Dados encontrados. Complete manualmente: ${missing.join(', ')}.`:'Dados e capa encontrados. Confira a edição antes de salvar.');
      if(response.data.fontes?.includes('Open Library'))setSource(response.data.isbn);
    } catch (error) {
      if(current!==sequence.current||controller.signal.aborted||latest.current!==selected)return;
      setFeedback(error.response?.data?.erro || "Não foi possível consultar o ISBN.");
    } finally {
      if(current===sequence.current)setLoading(false);
      if(pending.current===controller)pending.current=null;
    }
  }

  return (
    <div className="grid gap-3">
      <Field label="ISBN" hint={feedback&&<span role="status">{feedback}</span>}>
          <input
            type="text"
            value={value}
            onChange={(event) => change(event.target.value)}
            onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void buscar();}}}
            placeholder="Ex: 9788535914849"
          />
      </Field>
      <Button variant="secondary" onClick={buscar} busy={loading} className="justify-self-start">Preencher por ISBN</Button>
      {source&&<a href={`https://openlibrary.org/isbn/${encodeURIComponent(source)}`} target="_blank" rel="noreferrer" className="text-xs text-muted underline underline-offset-4">Dados bibliográficos: Open Library</a>}
    </div>
  );
}

export default IsbnLookup;
