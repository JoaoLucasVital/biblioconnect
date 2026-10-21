import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import "./dashboard-motion.css";

const integers = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function AnimatedNumber({ value, currency = false }) {
  const number = Number.isFinite(Number(value)) ? Number(value) : 0;
  const formatter = currency ? reais : integers;
  const visual = useRef(null), previous = useRef(0);
  useLayoutEffect(() => {
    const element = visual.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const show = value => element.setAttribute("data-number", formatter.format(value));
    if (media.matches || document.visibilityState !== "visible") {
      previous.current = number;
      show(number);
      return;
    }
    const counter = { value: previous.current };
    show(counter.value);
    const tween = gsap.to(counter, { value: number, duration: .28, ease: "power3.out",
      onUpdate: () => { previous.current = counter.value; show(counter.value); },
      onComplete: () => { previous.current = number; show(number); },
    });
    const finish = () => { tween.kill(); previous.current = number; show(number); };
    const visibility = () => { if (document.hidden) finish(); };
    media.addEventListener("change", finish);
    document.addEventListener("visibilitychange", visibility);
    return () => { tween.kill(); media.removeEventListener("change", finish); document.removeEventListener("visibilitychange", visibility); };
  }, [number, formatter]);
  // The accessible value stays exact while only the decorative counter changes.
  return <span className="bc-animated-number"><span className="sr-only">{formatter.format(number)}</span><span ref={visual} aria-hidden="true" data-number={formatter.format(number)} /></span>;
}
