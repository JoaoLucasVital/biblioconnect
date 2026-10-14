import { LoaderCircle } from "lucide-react";

const variants = {
  primary: "border-transparent bg-accent text-[#1e293b] hover:bg-accent-hover",
  secondary: "border-muted bg-surface text-ink hover:bg-soft",
  ghost: "border-transparent bg-transparent text-ink hover:bg-soft",
  danger: "border-transparent bg-red-700 text-white hover:bg-red-800",
};

export default function Button({ variant = "primary", busy = false, disabled = false,
  children, className = "", type = "button", ...props }) {
  return <button {...props} type={type} disabled={disabled || busy} aria-busy={busy || undefined}
    className={`bc-button inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.primary} ${className}`}>
    {busy && <LoaderCircle size={17} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
    {children}
  </button>;
}
