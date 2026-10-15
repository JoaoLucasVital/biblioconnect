import {it,expect} from "vitest";
import {webcrypto} from "node:crypto";
import {createOrderRequestKeys} from "./orderRequestKeys.js";
it("retains a request key on network failure/reload, replaces it after success and separates payloads",async()=>{
  const storage=new Map(),store={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key),get length(){return storage.size;},key:index=>[...storage.keys()][index]};
  const first=createOrderRequestKeys(store,webcrypto),request={method:"post",url:"/comprar",data:{livroId:1},headers:{}};
  await first.attach(request);const key=request.headers["Idempotency-Key"];
  first.settle(request,false);
  const retry={...request,headers:{}};await createOrderRequestKeys(store,webcrypto).attach(retry);expect(retry.headers["Idempotency-Key"]).toBe(key);
  const different={...request,data:{livroId:2},headers:{}};await first.attach(different);expect(different.headers["Idempotency-Key"]).not.toBe(key);
  first.settle(retry,true);const newOrder={...request,headers:{}};await first.attach(newOrder);expect(newOrder.headers["Idempotency-Key"]).not.toBe(key);
  expect([...storage.keys()].join()).not.toContain('livroId');
});
it("does not add keys to unrelated requests or override explicit keys",async()=>{
  const keys=createOrderRequestKeys(null,webcrypto);
  const config={method:"post",url:"/login",headers:{}};await keys.attach(config);expect(config.headers).toEqual({});
  const explicit={method:"post",url:"/comprar",headers:{"Idempotency-Key":"given"}};await keys.attach(explicit);expect(explicit.headers["Idempotency-Key"]).toBe("given");
});
