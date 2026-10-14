import Dialog from "../../components/ui/Dialog.jsx";
import Button from "../../components/ui/Button.jsx";
import Field from "../../components/ui/Field.jsx";
import StatusMessage from "../../components/ui/StatusMessage.jsx";
import { formatarMoeda, formatarData } from "./format.js";
export default function RentalDialog({livro,dias,calculo,busy,onDiasChange,onConfirmar,onClose,error}) {
  return <Dialog open={Boolean(livro)} title="Confirmar aluguel" busy={busy} onClose={onClose} footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button busy={busy} onClick={onConfirmar}>Confirmar aluguel</Button></>}>
    {livro && <><h3 className="wrap-anywhere font-display text-2xl">{livro.titulo}</h3><p className="text-sm text-muted">Estoque: {livro.estoque} · Valor base: {formatarMoeda(livro.precoAluguel)}<br/>{livro.diasInclusos} dias inclusos · Dia extra: {formatarMoeda(livro.precoDiaExtra)}</p>
      <Field label="Quantidade de dias"><input type="number" min="1" step="1" disabled={busy} value={dias} onChange={event=>onDiasChange(event.target.value)}/></Field>
      <dl className="grid gap-3 border-y border-stroke py-4 text-sm"><div className="flex justify-between gap-4"><dt>Dias extras</dt><dd>{calculo.diasExtras}</dd></div><div className="flex justify-between gap-4"><dt>Valor final</dt><dd className="text-lg font-semibold">{formatarMoeda(calculo.valorFinal)}</dd></div><div className="flex justify-between gap-4"><dt>Devolução prevista</dt><dd>{formatarData(calculo.devolucaoPrevista)}</dd></div></dl>
      {error && <StatusMessage type="error">{error}</StatusMessage>}</>}
  </Dialog>;
}
