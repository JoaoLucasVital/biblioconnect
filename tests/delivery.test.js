import test from "node:test";
// Provider boundary fixtures; real-route evidence is recorded separately.
import assert from "node:assert/strict";
import {calcularCotacaoEntrega,cotarModalidadeEntrega} from "../src/services/deliveryService.js";

const env={ORS_API_KEY:"test-secret",STORE_ADDRESS:"Rua José de Alencar, 511, Farol, Maceió - AL, Brasil"};
const origin=[-35.738,-9.650],destination=[-35.721,-9.663];
const response=data=>({ok:true,json:async()=>data});
const place=(coordinates,label="Praça pública, Maceió, Brasil",extra={})=>({features:[{geometry:{type:"Point",coordinates},properties:{country_a:"BRA",layer:"venue",confidence:1,label,...extra}}]});
function provider({distance=2500,duration=600,geocode,route}={}){
  const calls=[];
  return {calls,fetchImpl:async(input,options)=>{
    const url=new URL(input);calls.push({url,options});
    if(url.pathname==="/pelias/v1/search")return response(geocode??(url.searchParams.get("text")===env.STORE_ADDRESS?place(origin,env.STORE_ADDRESS):place(destination)));
    assert.equal(url.pathname,"/openrouteservice/v2/directions/driving-car/json");
    return response(route??{routes:[{summary:{distance,duration}}]});
  }};
}

test("openrouteservice uses road distance and backend-only authorization to calculate the tariff",async()=>{
  const upstream=provider();
  const quote=await calcularCotacaoEntrega("  Praça pública, Maceió  ",{env,...upstream});
  assert.equal(quote.valorEntrega,11.25);assert.equal(quote.distanciaKm,2.5);assert.equal(quote.duracao,"600s");
  assert.equal(quote.destino,"Praça pública, Maceió");assert.equal(quote.destinoEncontrado,"Praça pública, Maceió, Brasil");
  assert.equal(quote.provedor,"openrouteservice");assert.ok(!JSON.stringify(quote).includes("test-secret"));
  for(const {url,options} of upstream.calls){
    assert.equal(url.origin,"https://api.heigit.org");assert.ok(!url.href.includes("test-secret"));
    assert.equal(options.headers.Authorization,"test-secret");assert.ok(options.signal instanceof AbortSignal);
  }
  const geocodes=upstream.calls.filter(call=>call.url.pathname==="/pelias/v1/search");
  assert.equal(geocodes.length,2);
  for(const call of geocodes)assert.equal(call.url.searchParams.get("boundary.country"),"BRA");
  const body=JSON.parse(upstream.calls.at(-1).options.body);
  assert.deepEqual(body.coordinates,[origin,destination]);assert.equal(body.units,"m");
});
test("pickup is zero and a submitted freight/price cannot override the server calculation",async()=>{
  const pickup=await cotarModalidadeEntrega({modalidadeEntrega:"retirada",valorEntrega:999},{env:{},fetchImpl:()=>assert.fail("network")});
  assert.equal(pickup.valorEntrega,0);assert.equal(pickup.enderecoEntrega,null);
  const delivery=await cotarModalidadeEntrega({modalidadeEntrega:"entrega",enderecoEntrega:"Praça pública",valorEntrega:0,valor:1},{env,...provider()});
  assert.equal(delivery.valorEntrega,11.25);
});
test("invalid configuration and input do not consume provider quota",async()=>{
  for(const config of [{DELIVERY_BASE_FEE:"-1"},{DELIVERY_PRICE_PER_KM:"NaN"},{DELIVERY_BASE_FEE:"Infinity"}]){
    await assert.rejects(calcularCotacaoEntrega("Praça",{env:{...env,...config},fetchImpl:()=>assert.fail("network")}),/configuração/i);
  }
  for(const value of ["",null,{},"a".repeat(601),"rua\u0000"])await assert.rejects(calcularCotacaoEntrega(value,{env}),/endereço/i);
  await assert.rejects(calcularCotacaoEntrega("Praça",{env:{GOOGLE_MAPS_API_KEY:"obsolete",STORE_ADDRESS:env.STORE_ADDRESS}}),/indisponível/i);
  await assert.rejects(cotarModalidadeEntrega({modalidadeEntrega:"invalid"}),/modalidade/i);
});
test("provider rejections, timeouts and broken JSON expose safe actionable errors",async()=>{
  for(const status of [403,429,500])await assert.rejects(calcularCotacaoEntrega("Praça",{env,fetchImpl:async()=>({ok:false,status,json:async()=>({error:"test-secret private upstream"})})}),error=>error.status===503&&!error.message.includes("test-secret"));
  await assert.rejects(calcularCotacaoEntrega("Praça",{env,fetchImpl:async()=>{throw new DOMException("test-secret","TimeoutError");}}),/tempo/i);
  await assert.rejects(calcularCotacaoEntrega("Praça",{env,fetchImpl:async()=>({ok:true,json:async()=>{throw Error("private payload");}})}),error=>error.status===503&&!error.message.includes("private"));
});
test("invalid and imprecise geocodes cannot produce a priced route",async()=>{
  for(const geocode of [{features:[]},place([Infinity,-9]),place([-200,-9]),place(destination,"Cidade",{layer:"locality"}),place(destination,"Outro país",{country_a:"USA"}),place(destination,"Duvidoso",{confidence:0.2})]){
    const upstream=provider({geocode});
    await assert.rejects(calcularCotacaoEntrega("Praça",{env,...upstream}),error=>error.status===422&&/endereço/i.test(error.message));
    assert.ok(upstream.calls.every(call=>call.url.pathname==="/pelias/v1/search"));
  }
});
test("a high-confidence unrelated venue cannot stand in for the requested place",async()=>{
  const upstream=provider({geocode:place(origin,"Palato Farol, Maceio, AL, Brazil")});
  await assert.rejects(calcularCotacaoEntrega("Uninassau, Maceió",{env,...upstream}),error=>error.status===422);
});
test("street-level results explicitly disclose the approximation",async()=>{
  const upstream=provider({geocode:place(origin,"Rua José de Alencar, Maceió, Brasil",{layer:"street",confidence:0.8})});
  const quote=await calcularCotacaoEntrega("Rua José de Alencar, 500, Maceió",{env,...upstream});
  assert.equal(quote.localizacaoAproximada,true);
});
test("missing or invalid route metrics cannot become free or invented freight",async()=>{
  for(const route of [{routes:[]},{routes:[{summary:{distance:-1,duration:4}}]},{routes:[{summary:{distance:1,duration:"oops"}}]},{routes:[{summary:{distance:Infinity,duration:4}}]},{routes:[{summary:{distance:1,duration:-1}}]}]){
    await assert.rejects(calcularCotacaoEntrega("Praça",{env,...provider({route})}),error=>error.status===422&&/rota/i.test(error.message));
  }
});
