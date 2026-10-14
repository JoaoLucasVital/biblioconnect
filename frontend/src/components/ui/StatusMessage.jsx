import { CircleAlert, Info } from "lucide-react";
import Button from "./Button.jsx";

export default function StatusMessage({ type = "info", title, children, onRetry }) {
  const Icon = type === "error" ? CircleAlert : Info;
  return <div role={type === "error" ? "alert" : "status"} className="flex items-start gap-3 rounded-md bg-soft p-4 text-ink">
    <Icon size={20} aria-hidden="true" className={`mt-0.5 shrink-0 ${type === "error" ? "text-red-700 dark:text-red-300" : "text-muted"}`} />
    <div className="min-w-0 space-y-2 text-sm leading-relaxed">
      {title && <p className="font-semibold">{title}</p>}
      <div>{children}</div>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  </div>;
}
