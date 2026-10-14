import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";
import "./CardNav.css";

// Visual adaptation of React Bits CardNav, David Haz.
// Source and MIT + Commons Clause terms are recorded in THIRD_PARTY_NOTICES.md.
export default function CardNav({ open, motion = "instant", groups, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const groupId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const trigger = document.activeElement;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    const animations = [];
    if (motion === "pointer" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && dialog.animate) {
      const easing = getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "cubic-bezier(0.23, 1, 0.32, 1)";
      animations.push(dialog.animate([
        {opacity:0, transform:"translateY(-8px) scale(0.985)"},
        {opacity:1, transform:"translateY(0) scale(1)"},
      ], {duration:250, easing}));
      dialog.querySelectorAll(".bc-nav-card").forEach((card, index) => {
        animations.push(card.animate([
          {opacity:0, transform:"translateY(20px)"},
          {opacity:1, transform:"translateY(0)"},
        ], {duration:190, delay:index * 30, easing, fill:"backwards"}));
      });
    }
    return () => {
      animations.forEach(animation => animation.cancel());
      if (dialog.open) dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [open, motion]);

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 80rem)");
    const closeOnDesktop = event => { if (event.matches) onClose(); };
    closeOnDesktop(desktop);
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(<dialog id="menu-principal" ref={dialogRef} aria-labelledby={titleId} className="bc-card-nav"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = [...event.currentTarget.querySelectorAll("button, a[href]")]
        .filter(element => !element.matches(":disabled") && element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
    <div className="bc-card-nav-top">
      <div><span className="bc-card-nav-kicker">BiblioConnect</span><h2 id={titleId}>Navegação</h2></div>
      <button type="button" className="bc-card-nav-close" aria-label="Fechar navegação" onClick={onClose}><X size={24} aria-hidden="true"/></button>
    </div>
    <nav aria-label="Navegação móvel" className="bc-card-nav-content">
      {groups.map((group, index) => <section key={group.title} aria-labelledby={`${groupId}-${index}`} className={`bc-nav-card bc-nav-card--${group.tone}`}>
        <span className="bc-nav-card-number" aria-hidden="true">0{index + 1} / {group.eyebrow}</span>
        <h3 id={`${groupId}-${index}`}>{group.title}</h3>
        {group.description && <p className="bc-nav-card-description">{group.description}</p>}
        <div className="bc-nav-card-links">
          {group.links?.map(link => <NavLink key={link.to} end={link.to === "/" || link.to === "/admin"} to={link.to} onClick={onClose} className="bc-nav-card-link">
            <ArrowUpRight size={19} aria-hidden="true"/><span>{link.label}</span>
          </NavLink>)}
          {group.action}
        </div>
      </section>)}
    </nav>
    <p className="bc-card-nav-footnote">Sua próxima leitura começa aqui.</p>
  </dialog>, document.body);
}
