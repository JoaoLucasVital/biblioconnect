// Snapshot reveal based on the View Transitions API; the theme works without it.
// https://developer.chrome.com/docs/web-platform/view-transitions/same-document
let currentTransition;
let generation = 0;

export function transitionTheme(control, apply, { instant = false } = {}) {
  const request = ++generation;
  const previous = currentTransition;
  currentTransition = undefined;
  previous?.skipTransition();
  const root = document.documentElement;
  root.classList.remove("bc-theme-transition");
  let applied = false;
  const update = () => { if (!applied && request === generation) { applied = true; apply(); } };
  if (instant || !document.startViewTransition || !root.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  const { left, top, width, height } = control.getBoundingClientRect();
  const x = left + width / 2, y = top + height / 2;
  const radius = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)));
  root.classList.add("bc-theme-transition");
  try {
    const transition = document.startViewTransition(update);
    currentTransition = transition;
    const finished = transition.finished.catch(() => {});
    transition.ready.then(() => {
      if (currentTransition !== transition || request !== generation) return;
      const easing = getComputedStyle(root).getPropertyValue("--ease-out").trim() || "cubic-bezier(0.23, 1, 0.32, 1)";
      root.animate([
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
      ], { duration: 280, easing, pseudoElement: "::view-transition-new(root)" });
    }).catch(update).finally(() => finished.then(() => {
      if (currentTransition === transition) {
        currentTransition = undefined;
        root.classList.remove("bc-theme-transition");
      }
    }));
  } catch {
    update();
    root.classList.remove("bc-theme-transition");
  }
}
