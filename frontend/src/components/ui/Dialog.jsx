import { useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./Button.jsx";

export default function Dialog({ open, title, busy = false, onClose, children, footer }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const element = dialogRef.current;
    if (!open || !element) return;
    const trigger = document.activeElement;
    if (!element.open) element.showModal();
    return () => {
      if (element.open) element.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [open]);
  if (!open) return null;
  const close = () => { if (!busy) onClose(); };
  return createPortal(<dialog ref={dialogRef} aria-labelledby={titleId} aria-busy={busy || undefined}
    onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    }}
    className="bc-dialog m-auto max-h-[85dvh] w-[min(640px,calc(100%_-_32px))] overflow-y-auto rounded-lg border-0 bg-surface p-0 text-ink shadow-2xl">
    <header className="flex items-start justify-between gap-4 border-b border-stroke px-5 py-4 sm:px-7">
      <h2 id={titleId} className="font-display text-2xl leading-snug">{title}</h2>
      <Button variant="ghost" disabled={busy} onClick={close} aria-label="Fechar diálogo" className="shrink-0 px-2">
        <X size={20} aria-hidden="true" />
      </Button>
    </header>
    <div className="grid gap-5 px-5 py-5 sm:px-7">{children}</div>
    {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-stroke px-5 py-4 sm:px-7">{footer}</footer>}
  </dialog>, document.body);
}
