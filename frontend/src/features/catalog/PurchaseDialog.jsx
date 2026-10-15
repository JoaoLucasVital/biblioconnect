import Dialog from "../../components/ui/Dialog.jsx";
import Button from "../../components/ui/Button.jsx";
import BookCover from "../../components/ui/BookCover.jsx";
import { ArrowRight } from "lucide-react";
import { formatarMoeda } from "./format.js";
export default function PurchaseDialog({livro,onContinuar,onClose}) {
  return <Dialog open={Boolean(livro)} title="Sua próxima leitura" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Voltar ao acervo</Button><Button onClick={onContinuar}>Continuar para checkout<ArrowRight size={17} aria-hidden="true"/></Button></>}>
    {livro && <div className="flex items-center gap-6 py-2"><BookCover livro={livro} className="w-24 shrink-0 rounded-sm shadow-lg"/><div className="min-w-0"><p className="mb-2 text-xs uppercase tracking-widest text-muted">Selecionado para você</p><h3 className="wrap-anywhere font-display text-2xl leading-snug">{livro.titulo}</h3><p className="mt-2 text-sm text-muted">{livro.autor}</p><p className="mt-5 text-xl font-semibold">{formatarMoeda(livro.precoCompra)}</p><p className="mt-2 text-xs leading-relaxed text-muted">Escolha como receber e confira o total na próxima etapa.</p></div></div>}
  </Dialog>;
}
