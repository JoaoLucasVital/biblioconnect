import Dialog from "../../components/ui/Dialog.jsx";
import Button from "../../components/ui/Button.jsx";
import Field from "../../components/ui/Field.jsx";
import StatusMessage from "../../components/ui/StatusMessage.jsx";
import { formatarMoeda } from "./format.js";
export default function PurchaseDialog({livro,modalidadeEntrega,enderecoEntrega,cotacaoEntrega,loadingCotacao,loadingCompra,onModalidadeChange,onEnderecoChange,onCotar,onConfirmar,onClose,error}) {
  const busy=loadingCompra || loadingCotacao;
  return <Dialog open={Boolean(livro)} title="Confirmar compra" busy={busy} onClose={onClose} footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button busy={loadingCompra} disabled={loadingCotacao || (modalidadeEntrega==="entrega" && !cotacaoEntrega)} onClick={onConfirmar}>Confirmar compra</Button></>}>
    {livro && <><div><h3 className="wrap-anywhere font-display text-2xl">{livro.titulo}</h3><p className="mt-1 text-sm text-muted">{livro.autor} · {livro.categoria}</p><p className="mt-3 text-xl font-semibold">{formatarMoeda(livro.precoCompra)}</p></div>
    <fieldset disabled={busy} className="grid min-w-0 gap-3 border-0 p-0"><legend className="mb-3 text-sm font-medium">Como deseja receber?</legend>
      {[["retirada","Buscar na loja","Sem frete. Retire em até 7 dias."],["entrega","Receber em casa","Calcule o frete para seu endereço."]].map(([value,title,description])=><label key={value} className={`flex min-h-16 cursor-pointer items-start gap-3 rounded border p-4 ${modalidadeEntrega===value?"border-ink bg-soft":"border-stroke"}`}><input className="mt-1 accent-accent" type="radio" name="modalidadeEntrega" value={value} checked={modalidadeEntrega===value} onChange={()=>onModalidadeChange(value)}/><span className="text-sm"><strong className="block font-medium">{title}</strong><span className="text-muted">{description}</span></span></label>)}
    </fieldset>
    {modalidadeEntrega==="entrega" && <div className="grid gap-4"><Field label="Endereço de entrega" hint="O frete precisa ser recalculado se o endereço mudar."><textarea rows={3} disabled={busy} value={enderecoEntrega} onChange={event=>onEnderecoChange(event.target.value)} placeholder="Rua, número, bairro, cidade, estado e CEP"/></Field><Button variant="secondary" busy={loadingCotacao} disabled={loadingCompra} onClick={onCotar}>Calcular frete</Button>
      {cotacaoEntrega && <div className="grid gap-1 border-l-2 border-accent pl-4 text-sm"><span>Distância: {cotacaoEntrega.distanciaKm} km</span><span>Frete: {formatarMoeda(cotacaoEntrega.valorEntrega)}</span><strong>Total: {formatarMoeda(Number(livro.precoCompra)+Number(cotacaoEntrega.valorEntrega))}</strong></div>}
    </div>}
    {error && <StatusMessage type="error">{error}</StatusMessage>}</>}
  </Dialog>;
}
