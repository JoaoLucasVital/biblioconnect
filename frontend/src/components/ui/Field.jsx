import { Children, cloneElement, useId } from "react";

/** Input group adapted from emmanuelh-dev's Uiverse Tailwind component; see notices. */
export default function Field({ id, label, error, hint, children, leading, trailing }) {
  const generatedId = useId();
  const child = Children.only(children);
  const controlId = id || child.props.id || generatedId;
  const describedBy = [child.props["aria-describedby"], hint && `${controlId}-hint`, error && `${controlId}-error`].filter(Boolean).join(" ");
  return <div className="grid min-w-0 gap-2">
    <label htmlFor={controlId} className="text-sm font-medium text-ink">{label}</label>
    <div className={`flex min-w-0 items-center overflow-hidden rounded-md border bg-surface focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/20 ${error ? "border-red-700" : "border-muted"}`}>
      {leading && <span className="grid w-11 shrink-0 place-items-center border-r border-stroke text-muted" aria-hidden="true">{leading}</span>}
      {cloneElement(child, {
        id: controlId,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : child.props["aria-invalid"],
        className: `min-h-11 w-full min-w-0 border-0 bg-transparent px-3 py-2.5 text-base text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60 ${child.props.className || ""}`,
      })}
      {trailing && <span className="shrink-0 pr-1">{trailing}</span>}
    </div>
    {hint && <p id={`${controlId}-hint`} className="text-sm text-muted">{hint}</p>}
    {error && <p id={`${controlId}-error`} className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">{error}</p>}
  </div>;
}
