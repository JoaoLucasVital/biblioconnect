import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import { useRef, useCallback, useEffect, useState } from "react";
import api from "../api/api.js";

function AdminChat() {
  const [conversas, setConversas] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [texto, setTexto] = useState("");
  const [feedback, setFeedback] = useState("");
  const [enviando, setEnviando] = useState(false);
  const selecionadaRef = useRef(null);

  const carregarConversas = useCallback(async () => {
    try {
      const response = await api.get("/admin/chat/conversas");
      setConversas(response.data || []);
    } catch (error) {
      setFeedback(error.response?.data?.erro || "Erro ao carregar conversas.");
    }
  }, []);

  async function abrir(id) {
    selecionadaRef.current = id;
    try {
      const response = await api.get(`/admin/chat/conversas/${id}`);
      if (selecionadaRef.current === id) setSelecionada(response.data);
    } catch (error) { setFeedback(error.response?.data?.erro || "Erro ao abrir conversa."); }
  }

  async function responder(event) {
    event.preventDefault();
    if (!selecionada || !texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await api.post(`/admin/chat/conversas/${selecionada.id}/mensagens`, { texto: texto.trim() });
      setTexto("");
      setFeedback("");
      if (selecionadaRef.current === selecionada.id) await abrir(selecionada.id);
      await carregarConversas();
    } catch (error) { setFeedback(error.response?.data?.erro || "Erro ao responder."); }
    finally { setEnviando(false); }
  }

  async function encerrar() {
    if (!selecionada || enviando) return;
    setEnviando(true);
    try {
      await api.patch(`/admin/chat/conversas/${selecionada.id}/status`, { status: "encerrada" });
      selecionadaRef.current = null;
      setSelecionada(null);
      await carregarConversas();
    } catch (error) { setFeedback(error.response?.data?.erro || "Erro ao encerrar."); }
    finally { setEnviando(false); }
  }

  useEffect(() => {
    let ativo = true;
    // Consulta também a conversa selecionada; antes só a lista lateral era atualizada.
    async function atualizar() {
      await carregarConversas();
      const id = selecionadaRef.current;
      if (!id) return;
      try {
        const response = await api.get(`/admin/chat/conversas/${id}`);
        if (ativo && selecionadaRef.current === id) setSelecionada(response.data);
      } catch (error) { if (ativo) setFeedback(error.response?.data?.erro || "Falha ao atualizar mensagens."); }
    }
    Promise.resolve().then(() => { if (ativo) return atualizar(); });
    const timer = setInterval(atualizar, 8000);
    return () => { ativo = false; clearInterval(timer); };
  }, [carregarConversas]);

  return (
    <main  className="py-10 sm:py-14">
      <div  className="mx-auto w-full max-w-7xl px-5 sm:px-8 grid min-w-0 gap-7 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside  className="grid content-start gap-3">
          <h1  className="font-display text-4xl leading-tight sm:text-5xl">Atendimentos</h1>
          {feedback && <StatusMessage type={"error"}>{feedback}</StatusMessage>}
          {conversas.map((conversa) => (
            <Button key={conversa.id} onClick={() => abrir(conversa.id)} type="button" variant="secondary" className="grid min-w-0 gap-2 border border-stroke p-4 text-left text-sm [&_small]:truncate [&_small]:text-xs [&_small]:text-muted">
              <strong>{conversa.usuario?.nome}</strong>
              <span>{conversa.status}</span>
              <small>{conversa.mensagens?.[0]?.texto || "Sem mensagens"}</small>
            </Button>
          ))}
        </aside>

        <section  className="min-w-0 border border-stroke bg-surface min-h-80">
          {!selecionada ? <p  className="py-10 text-center text-sm text-muted">Selecione uma conversa.</p> : (
            <>
              <div  className="flex flex-wrap items-start justify-between gap-3 border-b border-stroke p-4 text-sm [&_small]:block [&_small]:text-xs [&_small]:text-muted">
                <div><strong>{selecionada.usuario?.nome}</strong><small>{selecionada.usuario?.email}</small></div>
                {selecionada.status === "aberta" && <Button onClick={encerrar} type="button" variant="secondary">Encerrar</Button>}
              </div>
              <div  className="grid max-h-[55dvh] min-h-56 gap-4 overflow-y-auto p-4 sm:p-6">
                {selecionada.mensagens?.map((mensagem) => (
                  <div key={mensagem.id} className="max-w-[90%] wrap-anywhere rounded-md border border-stroke p-4 text-sm [&_strong]:block [&_strong]:mb-2 [&_small]:mt-2 [&_small]:block [&_small]:text-xs [&_small]:text-muted">
                    <strong>{mensagem.remetente?.nome}</strong>
                    <p>{mensagem.texto}</p>
                    <small>{new Date(mensagem.createdAt).toLocaleString("pt-BR")}</small>
                  </div>
                ))}
              </div>
              {selecionada.status === "aberta" && (
                <form onSubmit={responder} className="grid gap-3 border-t border-stroke p-4 sm:grid-cols-[1fr_auto]">
                  <textarea aria-label="Resposta ao cliente" maxLength={2000} disabled={enviando} value={texto} onChange={(event) => setTexto(event.target.value)} required className="min-h-11 w-full min-w-0 rounded-md border border-muted bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted disabled:opacity-60"/>
                  <Button disabled={enviando} type="submit" variant="primary">{enviando ? "Enviando..." : "Responder"}</Button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminChat;
