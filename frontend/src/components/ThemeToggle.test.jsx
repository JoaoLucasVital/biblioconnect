import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ThemeToggle from "./ThemeToggle.jsx";

const originalTransition = Object.getOwnPropertyDescriptor(document, "startViewTransition");
const originalAnimate = Object.getOwnPropertyDescriptor(document.documentElement, "animate");
beforeEach(() => {
  document.body.classList.remove("dark");
  Object.defineProperty(document.documentElement, "animate", { configurable: true, value: vi.fn(() => ({ finished: Promise.resolve() })) });
  Object.defineProperty(document, "startViewTransition", { configurable: true, value: vi.fn(update => {
    update();
    return { ready: Promise.resolve(), finished: Promise.resolve(), skipTransition: vi.fn() };
  }) });
});
afterEach(() => {
  document.body.classList.remove("dark");
  document.documentElement.classList.remove("bc-theme-transition");
  if (originalTransition) Object.defineProperty(document, "startViewTransition", originalTransition);
  else delete document.startViewTransition;
  if (originalAnimate) Object.defineProperty(document.documentElement, "animate", originalAnimate);
  else delete document.documentElement.animate;
});

it("revela o tema a partir do controle e persiste a escolha", async () => {
  render(<ThemeToggle />);
  const control = screen.getByRole("switch", { name: "Tema escuro" });
  vi.spyOn(control, "getBoundingClientRect").mockReturnValue({ left: 40, top: 20, width: 60, height: 34 });
  fireEvent.click(control, { detail: 1 });
  expect(document.startViewTransition).toHaveBeenCalledOnce();
  expect(document.body).toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("dark");
  await waitFor(() => expect(document.documentElement.animate).toHaveBeenCalledWith(
    [{ clipPath: "circle(0px at 70px 37px)" }, { clipPath: expect.stringMatching(/^circle\([\d.]+px at 70px 37px\)$/) }],
    expect.objectContaining({ pseudoElement: "::view-transition-new(root)", duration: 280 }),
  ));
});

it("respeita movimento reduzido sem atrasar a troca", () => {
  vi.spyOn(window, "matchMedia").mockImplementation(query => ({ matches: query.includes("prefers-reduced-motion"), addEventListener() {}, removeEventListener() {} }));
  render(<ThemeToggle />);
  fireEvent.click(screen.getByRole("switch", { name: "Tema escuro" }), { detail: 1 });
  expect(document.body).toHaveClass("dark");
  expect(document.startViewTransition).not.toHaveBeenCalled();
  expect(document.documentElement.animate).not.toHaveBeenCalled();
});

it("continua funcionando se a API de transição falhar", () => {
  Object.defineProperty(document, "startViewTransition", { configurable: true, value: vi.fn(() => { throw new Error("Unavailable"); }) });
  render(<ThemeToggle />);
  fireEvent.click(screen.getByRole("switch", { name: "Tema escuro" }), { detail: 1 });
  expect(document.startViewTransition).toHaveBeenCalledOnce();
  expect(document.body).toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("dark");
});

it("aplica o tema imediatamente quando o controle é ativado por teclado", () => {
  render(<ThemeToggle />);
  fireEvent.click(screen.getByRole("switch", { name: "Tema escuro" }), { detail: 0 });
  expect(document.body).toHaveClass("dark");
  expect(document.startViewTransition).not.toHaveBeenCalled();
});

it("uma escolha imediata mais recente invalida a transição ainda pendente", async () => {
  let delayedUpdate, resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const skipTransition = vi.fn();
  document.startViewTransition.mockImplementationOnce(update => {
    delayedUpdate = update;
    return { ready, finished: ready, skipTransition };
  });
  render(<ThemeToggle />);
  const control = screen.getByRole("switch", { name: "Tema escuro" });
  fireEvent.click(control, { detail: 1 });
  fireEvent.click(control, { detail: 0 });
  await act(async () => { delayedUpdate(); resolveReady(); });
  expect(document.body).not.toHaveClass("dark");
  expect(localStorage.getItem("theme")).toBe("light");
  expect(skipTransition).toHaveBeenCalledOnce();
  expect(document.startViewTransition).toHaveBeenCalledOnce();
  expect(control).not.toBeChecked();
});
