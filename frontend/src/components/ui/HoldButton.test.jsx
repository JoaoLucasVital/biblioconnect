import {it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent,act} from "@testing-library/react";
import HoldButton from "./HoldButton.jsx";
afterEach(()=>vi.useRealTimers());
it("hold confirma uma única vez aos 1200 ms e fica verde ao completar",()=>{
  vi.useFakeTimers();const onConfirm=vi.fn(()=>new Promise(()=>{}));render(<HoldButton onConfirm={onConfirm}>Confirmar compra</HoldButton>);const button=screen.getByRole("button",{name:"Confirmar compra",exact:true});
  fireEvent.pointerDown(button,{button:0,pointerId:1});act(()=>vi.advanceTimersByTime(1199));expect(onConfirm).not.toHaveBeenCalled();act(()=>vi.advanceTimersByTime(1));expect(onConfirm).toHaveBeenCalledTimes(1);expect(button).toHaveAttribute("data-state","done");act(()=>vi.advanceTimersByTime(2400));expect(onConfirm).toHaveBeenCalledTimes(1);
});
it.each(["pointerUp","pointerCancel","blur"])("%s cancela hold antes de completar",event=>{
  vi.useFakeTimers();const onConfirm=vi.fn();render(<HoldButton onConfirm={onConfirm}>Confirmar compra</HoldButton>);const button=screen.getByRole("button",{name:"Confirmar compra",exact:true});fireEvent.pointerDown(button,{button:0});vi.advanceTimersByTime(600);fireEvent[event](button);vi.advanceTimersByTime(1200);expect(onConfirm).not.toHaveBeenCalled();
});
it("desmontagem e disabled impedem confirmação; somente pressão confirma, inclusive por teclado",()=>{
  vi.useFakeTimers();const onConfirm=vi.fn();const view=render(<HoldButton onConfirm={onConfirm}>Confirmar compra</HoldButton>);fireEvent.pointerDown(screen.getByRole("button",{name:"Confirmar compra",exact:true}));view.unmount();vi.advanceTimersByTime(2000);expect(onConfirm).not.toHaveBeenCalled();
  const next=render(<HoldButton disabled onConfirm={onConfirm}>Confirmar compra</HoldButton>);fireEvent.keyDown(screen.getByRole("button",{name:"Confirmar compra",exact:true}),{key:" "});vi.advanceTimersByTime(2000);expect(onConfirm).not.toHaveBeenCalled();next.rerender(<HoldButton onConfirm={onConfirm}>Confirmar compra</HoldButton>);
  expect(screen.queryByRole("button",{name:"Confirmar sem segurar"})).not.toBeInTheDocument();
  const button=screen.getByRole("button",{name:"Confirmar compra",exact:true});fireEvent.click(button);expect(onConfirm).not.toHaveBeenCalled();
  fireEvent.keyDown(button,{key:" "});act(()=>vi.advanceTimersByTime(1199));expect(onConfirm).not.toHaveBeenCalled();act(()=>vi.advanceTimersByTime(1));expect(onConfirm).toHaveBeenCalledTimes(1);
});
it("desabilitar no meio cancela progresso e exige nova interação ao reabilitar",async()=>{
  vi.useFakeTimers();const onConfirm=vi.fn(),view=render(<HoldButton onConfirm={onConfirm}>Confirmar compra</HoldButton>);const button=screen.getByRole("button",{name:"Confirmar compra",exact:true});fireEvent.pointerDown(button);act(()=>vi.advanceTimersByTime(600));view.rerender(<HoldButton disabled onConfirm={onConfirm}>Confirmar compra</HoldButton>);await act(async()=>{await Promise.resolve();});view.rerender(<HoldButton onConfirm={onConfirm}>Confirmar compra</HoldButton>);act(()=>vi.advanceTimersByTime(2000));expect(onConfirm).not.toHaveBeenCalled();expect(button).toHaveAttribute("data-state","idle");
});
it("sair da janela durante hold cancela a confirmação",()=>{
  vi.useFakeTimers();const onConfirm=vi.fn();render(<HoldButton onConfirm={onConfirm}>Confirmar compra</HoldButton>);fireEvent.pointerDown(screen.getByRole("button",{name:"Confirmar compra",exact:true}));act(()=>vi.advanceTimersByTime(600));fireEvent(window,new Event("blur"));act(()=>vi.advanceTimersByTime(1200));expect(onConfirm).not.toHaveBeenCalled();
});
