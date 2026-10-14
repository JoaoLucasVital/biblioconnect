import {it,expect,vi} from "vitest";
import {restrictWorkerNetwork} from "./worker-network.js";
it("worker só pode buscar os recursos locais e bloqueia telemetria antes da rede",async()=>{
  const fetch=vi.fn().mockResolvedValue("local"),open=vi.fn();
  class XHR{open(...args){open(...args);}}
  const scope={location:{origin:"https://biblioteca.test",href:"https://biblioteca.test/worker.js"},fetch,XMLHttpRequest:XHR};restrictWorkerNetwork(scope);
  await expect(scope.fetch("/models/local.wasm")).resolves.toBe("local");await expect(scope.fetch("https://odml.pa.googleapis.com/v1/log")).rejects.toThrow(/recursos locais/);expect(fetch).toHaveBeenCalledTimes(1);
  const xhr=new scope.XMLHttpRequest();xhr.open("GET","/models/local.wasm");expect(()=>xhr.open("POST","https://odml.pa.googleapis.com/v1/log")).toThrow(/recursos locais/);expect(open).toHaveBeenCalledTimes(1);
});
