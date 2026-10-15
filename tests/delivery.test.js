import test from "node:test";
import assert from "node:assert/strict";
import {calcularCotacaoEntrega,cotarModalidadeEntrega} from "../src/services/deliveryService.js";

const env={GOOGLE_MAPS_API_KEY:"test-secret",STORE_ADDRESS:"Rua José de Alencar, 511, Farol, Maceió - AL, Brasil"};
const result=(distanceMeters=2500,duration="600s")=>({ok:true,json:async()=>({routes:[{distanceMeters,duration}]})});
test("Google distance uses configured tariffs, field mask and server-only key",async()=>{
  let sent;const fetchImpl=async(url,options)=>{sent={url,...options};return result();};
  const quote=await calcularCotacaoEntrega("  Praça pública, Maceió  ",{env,fetchImpl});
  assert.equal(quote.valorEntrega,11.25);assert.equal(quote.distanciaKm,2.5);
  assert.equal(sent.headers["X-Goog-FieldMask"],"routes.distanceMeters,routes.duration");
  assert.equal(JSON.parse(sent.body).origin.address,env.STORE_ADDRESS);
  assert.equal(quote.destino,"Praça pública, Maceió");assert.ok(!JSON.stringify(quote).includes("test-secret"));
});
test("pickup is zero and submitted price/freight cannot change delivery calculation",async()=>{
  const pickup=await cotarModalidadeEntrega({modalidadeEntrega:"retirada",valorEntrega:999},{env:{},fetchImpl:()=>{throw Error("not called");}});
  assert.equal(pickup.valorEntrega,0);assert.equal(pickup.enderecoEntrega,null);
  const delivery=await cotarModalidadeEntrega({modalidadeEntrega:"entrega",enderecoEntrega:"Praça pública",valorEntrega:0,valor:1},{env,fetchImpl:async()=>result()});
  assert.equal(delivery.valorEntrega,11.25);
});
test("invalid configuration and input never call Google",async()=>{
  for(const config of [{DELIVERY_BASE_FEE:"-1"},{DELIVERY_PRICE_PER_KM:"NaN"},{DELIVERY_BASE_FEE:"Infinity"}]){
    await assert.rejects(calcularCotacaoEntrega("Praça",{env:{...env,...config},fetchImpl:()=>{assert.fail("network");}}),/configuração/i);
  }
  for(const destination of ["",null,{},"a".repeat(601),"rua\u0000"]){await assert.rejects(calcularCotacaoEntrega(destination,{env}),/endereço/i);}
  await assert.rejects(calcularCotacaoEntrega("Praça",{env:{}}),/indisponível/i);
  await assert.rejects(cotarModalidadeEntrega({modalidadeEntrega:"invalid"}),/modalidade/i);
});
test("upstream rejection/timeout/invalid routes expose only safe actionable errors",async()=>{
  for(const status of [403,429,500])await assert.rejects(calcularCotacaoEntrega("Praça",{env,fetchImpl:async()=>({ok:false,status,json:async()=>({error:{message:"test-secret private upstream"}})})}),error=>error.status===503&&!error.message.includes("test-secret"));
  await assert.rejects(calcularCotacaoEntrega("Praça",{env,fetchImpl:async()=>{throw new DOMException("test-secret","TimeoutError");}}),/tempo/i);
  for(const bad of [{routes:[]},{routes:[{distanceMeters:-1,duration:"4s"}]},{routes:[{distanceMeters:1,duration:"oops"}]},{routes:[{distanceMeters:Infinity,duration:"4s"}]}])await assert.rejects(calcularCotacaoEntrega("Praça",{env,fetchImpl:async()=>({ok:true,json:async()=>bad})}),/rota/i);
});
