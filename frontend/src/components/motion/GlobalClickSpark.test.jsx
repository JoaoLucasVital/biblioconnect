import {it,expect,vi,afterEach} from "vitest";
import {render,screen,fireEvent} from "@testing-library/react";
import GlobalClickSpark from "./GlobalClickSpark.jsx";
const original=Object.getOwnPropertyDescriptor(HTMLElement.prototype,"animate");
afterEach(()=>{if(original)Object.defineProperty(HTMLElement.prototype,"animate",original);else delete HTMLElement.prototype.animate;});
it("clique mantém ação/foco, emite oito partículas, limita 32 e limpa tudo",()=>{
  const animate=vi.fn(()=>({cancel:vi.fn()}));Object.defineProperty(HTMLElement.prototype,"animate",{configurable:true,value:animate});
  const action=vi.fn(),view=render(<><GlobalClickSpark/><button onClick={action}>Abrir</button></>);const button=screen.getByRole("button",{name:"Abrir"});button.focus();fireEvent.click(button,{detail:1,clientX:20,clientY:30});expect(action).toHaveBeenCalledTimes(1);expect(button).toHaveFocus();expect(document.querySelectorAll(".bc-click-spark")).toHaveLength(8);
  for(let i=0;i<5;i++)fireEvent.click(button,{detail:1});expect(document.querySelectorAll(".bc-click-spark")).toHaveLength(32);fireEvent.click(button,{detail:0});expect(document.querySelectorAll(".bc-click-spark")).toHaveLength(32);view.unmount();expect(document.querySelectorAll(".bc-click-spark")).toHaveLength(0);
});
it("movimento reduzido não cria partículas",()=>{
  vi.spyOn(window,"matchMedia").mockImplementation(query=>({matches:query.includes("prefers-reduced-motion"),media:query,addEventListener(){},removeEventListener(){}}));Object.defineProperty(HTMLElement.prototype,"animate",{configurable:true,value:vi.fn(()=>({cancel:vi.fn()}))});render(<GlobalClickSpark/>);fireEvent.click(document.body,{detail:1});expect(document.querySelectorAll(".bc-click-spark")).toHaveLength(0);
});
