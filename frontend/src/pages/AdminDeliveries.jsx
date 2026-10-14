import ResponsiveTable from "../components/ui/ResponsiveTable.jsx";
import StatusMessage from "../components/ui/StatusMessage.jsx";
import Button from "../components/ui/Button.jsx";
import useInitialLoad from "../components/useInitialLoad.js";
import { useCallback, useMemo, useState } from "react";
import api from "../api/api.js";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AdminDeliveries() {
  const [pedidos, setPedidos] = useState([]);
  const [links, setLinks] = useState([]);
  const [feedback, setFeedback] = useState("");

  const carregar = useCallback(async () => {
    try {
      const [pedidosResponse, linksResponse] = await Promise.all([
        api.get("/admin/pedidos"),
        api.get("/admin/entregas/terceirizadas"),
      ]);
      setPedidos(pedidosResponse.data || []);
      setLinks(linksResponse.data || []);
    } catch (error) {
      setFeedback(error.response?.data?.erro || "Erro ao carregar entregas.");
    }
  }, []);

  async function atualizar(id, statusEntrega) {
    try {
    await api.patch(`/admin/pedidos/${id}/entrega`, { statusEntrega });
    carregar();
    } catch (error) { setFeedback(error.response?.data?.erro || "Não foi possível salvar a alteração."); }
  }

  const entregas = useMemo(() => pedidos.filter((pedido) => pedido.modalidadeEntrega === "entrega"), [pedidos]);

  useInitialLoad(carregar);

  return <main className="py-10 sm:py-14"><div className="mx-auto grid w-full min-w-0 max-w-7xl gap-7 px-5 sm:px-8">
    <header><p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted">Logística</p><h1 className="font-display text-4xl">Entregas</h1><p className="mt-3 max-w-2xl text-sm text-muted">Acompanhe entregas próprias ou abra um parceiro terceirizado quando não houver entregador disponível.</p></header>
    {feedback && <StatusMessage type="error">{feedback}</StatusMessage>}
    <div className="flex flex-wrap gap-3">{links.map(link=><a className="inline-flex min-h-11 items-center rounded border border-muted bg-surface px-4 text-sm" href={link.url} target="_blank" rel="noreferrer" key={link.nome}>{link.nome}</a>)}</div>
    {entregas.length===0 ? <p className="border-t border-stroke py-10 text-sm text-muted">Nenhuma entrega para acompanhar.</p> :
    <ResponsiveTable caption="Entregas da biblioteca"><thead><tr>{["Pedido e livro","Cliente e endereço","Frete","Situação e ações"].map(label=><th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{entregas.map(pedido=><tr key={pedido.id}><th scope="row" className="min-w-44 max-w-64 font-normal"><span className="text-xs text-muted">Pedido #{pedido.id}</span><p className="mt-2 wrap-anywhere font-display text-xl">{pedido.livro?.titulo}</p></th>
      <td className="min-w-52 max-w-64"><p className="mb-2 wrap-anywhere font-medium">{pedido.usuario?.nome}</p><p className="wrap-anywhere text-muted">{pedido.enderecoEntrega}</p></td>
      <td className="min-w-28"><p>{formatarMoeda(pedido.valorEntrega)}</p><p className="mt-1 text-xs text-muted">{pedido.distanciaEntregaKm || 0} km</p></td>
      <td className="min-w-72"><p className="mb-3 text-xs text-muted">{pedido.statusEntrega}</p><div className="flex max-w-80 flex-wrap gap-2">{[["preparando","Preparando"],["aguardando_entregador","Aguardando entregador"],["em_transporte","Em transporte"],["entregue","Entregue"]].map(([status,label])=><Button key={status} variant={status==="em_transporte"?"primary":"secondary"} onClick={()=>atualizar(pedido.id,status)}>{label}</Button>)}</div></td>
    </tr>)}</tbody></ResponsiveTable>}
  </div></main>;
}
export default AdminDeliveries;
