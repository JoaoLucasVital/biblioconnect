import Dialog from "../../components/ui/Dialog.jsx";
import Button from "../../components/ui/Button.jsx";
import Field from "../../components/ui/Field.jsx";
import StatusMessage from "../../components/ui/StatusMessage.jsx";
import { formatarMoeda } from "./format.js";
export default function ReservationDialog({livro,dataRetirada,calculo,busy,onDataChange,onConfirmar,onClose,error}) {
  return <Dialog open={Boolean(livro)} title="Confirmar reserva" busy={busy} onClose={onClose} footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button busy={busy} onClick={onConfirmar}>Confirmar reserva</Button></>}>
    {livro && <><h3 className="wrap-anywhere font-display text-2xl">{livro.titulo}</h3><p className="text-sm text-muted">Estoque: {livro.estoque} · Prazo sem multa: até 7 dias.<br/>Após o prazo, a multa é de R$ 2,00 por dia.</p><Field label="Data de retirada"><input type="date" disabled={busy} value={dataRetirada} onChange={event=>onDataChange(event.target.value)}/></Field>
      {dataRetirada && <div className="grid gap-2 border-l-2 border-accent pl-4 text-sm"><p>Dias após prazo gratuito: <strong>{calculo.diasAtraso}</strong></p><p>Multa calculada: <strong>{formatarMoeda(calculo.multa)}</strong></p></div>}
      {error && <StatusMessage type="error">{error}</StatusMessage>}</>}
  </Dialog>;
}
