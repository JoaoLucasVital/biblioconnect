import {it,expect,vi,afterEach} from "vitest";
import {render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {createFavoritesStore} from "./favoritesStore.js";
import PulseHeart from "./PulseHeart.jsx";
afterEach(()=>vi.useRealTimers());
class Events{
  static instances=[];
  constructor(url){this.url=url;this.handlers={};Events.instances.push(this);}
  addEventListener(type,callback){this.handlers[type]=callback;}
  emit(type,value){this.handlers[type]?.({data:JSON.stringify(value)});}
  close(){this.closed=true;}
}
it("uma conexão atende vários livros, erro restaura estado e snapshot atrasado não desfaz gravação",async()=>{
  vi.useFakeTimers();Events.instances=[];
  const api={get:vi.fn().mockResolvedValue({data:{itens:[{livroId:1,total:3,salvo:false},{livroId:2,total:4,salvo:false}],cursor:"0"}}),put:vi.fn()};
  const store=createFavoritesStore({api,createEventSource:url=>new Events(url),apiBase:"http://localhost:3000"});store.setUser(7);
  const a=store.subscribe(1,()=>{}),b=store.subscribe(2,()=>{});await vi.advanceTimersByTimeAsync(50);expect(Events.instances).toHaveLength(1);expect(store.snapshot(1).total).toBe(3);
  let reject;api.put.mockImplementationOnce(()=>new Promise((_resolve,fail)=>{reject=fail;}));const save=store.setSaved(1,true),expected=expect(save).rejects.toThrow("offline");expect(store.snapshot(1)).toMatchObject({total:4,salvo:true,pending:true});reject(new Error("offline"));await expected;expect(store.snapshot(1)).toMatchObject({total:3,salvo:false,pending:false});expect(store.snapshot(2).total).toBe(4);
  let finish;api.get.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));const refresh=store.refresh();api.put.mockResolvedValueOnce({data:{livroId:1,total:5,salvo:true,cursor:"5"}});await store.setSaved(1,true);finish({data:{itens:[{livroId:1,total:3,salvo:false}],cursor:"1"}});await refresh;expect(store.snapshot(1)).toMatchObject({total:5,salvo:true});
  Events.instances[0].emit("favorite",{livroId:1,total:2,cursor:"2"});expect(store.snapshot(1).total).toBe(5);
  a();b();await vi.advanceTimersByTimeAsync(50);expect(Events.instances[0].closed).toBe(true);store.stop();
});
it("coração é controle separado e comunica estado salvo e contagem sem disparar duas vezes",async()=>{
  const onToggle=vi.fn();render(<PulseHeart title="Verity" total={12} saved busy={false} onToggle={onToggle}/>);
  const button=screen.getByRole("button",{name:/Remover Verity dos salvos/});expect(button).toHaveAttribute("aria-pressed","true");expect(screen.getByText("12")).toBeVisible();await userEvent.click(button);expect(onToggle).toHaveBeenCalledTimes(1);
});
it("confirmação lenta recupera alteração de outro leitor ocorrida enquanto o botão estava pendente",async()=>{
  vi.useFakeTimers();Events.instances=[];let finish;
  const api={get:vi.fn().mockResolvedValue({data:{itens:[{livroId:1,total:0,salvo:false}],cursor:"0"}}),put:vi.fn().mockImplementation(()=>new Promise(resolve=>{finish=resolve;}))};
  const store=createFavoritesStore({api,createEventSource:url=>new Events(url),apiBase:"http://localhost:3000"});store.setUser(7);const off=store.subscribe(1,()=>{});await vi.advanceTimersByTimeAsync(50);
  const pending=store.setSaved(1,true);api.get.mockResolvedValue({data:{itens:[{livroId:1,total:2,salvo:true}],cursor:"2"}});Events.instances[0].emit("favorite",{livroId:1,total:2,cursor:"2"});await vi.advanceTimersByTimeAsync(150);
  finish({data:{livroId:1,total:1,salvo:true,cursor:"1"}});await pending;await vi.advanceTimersByTimeAsync(150);expect(store.snapshot(1).total).toBe(2);off();store.stop();
});
