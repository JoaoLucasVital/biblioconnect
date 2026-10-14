import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/api.js";

function ClientChat() {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [feedback, setFeedback] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef(null);

  const carregar = useCallback(async (silencioso = false) => {
    try {
      const response = await api.get("/chat");
      setMensagens(response.data?.mensagens || []);
      if (!silencioso) setFeedback("");
    } catch (error) {
      if (!silencioso) setFeedback(error.response?.data?.erro || "Erro ao carregar chat.");
    }
  }, []);

  async function enviar(event) {
    event.preventDefault();
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;
    setEnviando(true);
    try {
      await api.post("/chat/mensagens", { texto: mensagem });
      setTexto("");
      carregar(true);
    } catch (error) {
      setFeedback(error.response?.data?.erro || "Erro ao enviar mensagem.");
    } finally { setEnviando(false); }
  }

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => { if (ativo) return carregar(); });
    const timer = setInterval(() => carregar(true), 8000);
    return () => { ativo = false; clearInterval(timer); };
  }, [carregar]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
  }, [mensagens.length]);

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8 grid max-w-4xl gap-7">
        <div>
          <span  className="mb-3 block text-xs uppercase tracking-[0.16em] text-muted">Atendimento</span>
          <h1  className="font-display text-4xl leading-tight sm:text-5xl">Chat com a BiblioConnect</h1>
          <p  className="my-3 max-w-2xl text-sm leading-relaxed text-muted">Envie dúvidas, solicitações ou feedback. As mensagens ficam registradas no sistema.</p>
        </div>
        {feedback && <StatusMessage type={"error"}>{feedback}</StatusMessage>}

        <section  className="min-w-0 border border-stroke bg-surface">
          <div  className="grid max-h-[55dvh] min-h-56 gap-4 overflow-y-auto p-4 sm:p-6">
            {mensagens.length === 0 && <p  className="py-10 text-center text-sm text-muted">Envie a primeira mensagem para iniciar o atendimento.</p>}
            {mensagens.map((mensagem) => (
              <div key={mensagem.id} className={`max-w-[90%] wrap-anywhere rounded-md border border-stroke p-4 text-sm [&_strong]:block [&_strong]:mb-2 [&_small]:mt-2 [&_small]:block [&_small]:text-xs [&_small]:text-muted ${mensagem.remetenteRole==="ADMIN" ? "justify-self-start bg-paper" : "justify-self-end bg-soft"}`}>
                <strong>{mensagem.remetenteRole === "ADMIN" ? "BiblioConnect" : "Você"}</strong>
                <p>{mensagem.texto}</p>
                <small>{new Date(mensagem.createdAt).toLocaleString("pt-BR")}</small>
              </div>
            ))}
            <div ref={fimRef}/>
          </div>
          <form onSubmit={enviar} className="grid gap-3 border-t border-stroke p-4 sm:grid-cols-[1fr_auto]">
            <textarea aria-label="Mensagem para a biblioteca" disabled={enviando} value={texto} onChange={(event) => setTexto(event.target.value)} placeholder="Digite sua mensagem..." maxLength="2000" required className="min-h-11 w-full min-w-0 rounded-md border border-muted bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted disabled:opacity-60"/>
            <Button type="submit" disabled={enviando} variant="primary">{enviando ? "Enviando..." : "Enviar"}</Button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default ClientChat;
