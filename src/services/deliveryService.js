/**
 * Cotação de entrega usando openrouteservice / HeiGIT.
 * A taxa é calculada por valor base + valor por quilômetro, ambos configuráveis.
 */
const ORS_URL = "https://api.heigit.org";

function erroEntrega(message,status=400){return Object.assign(new Error(message),{status});}
function numeroEnv(env,nome,padrao) {
  if(env[nome]===undefined || env[nome]==="")return padrao;
  const valor=Number(env[nome]);
  if(!Number.isFinite(valor)||valor<0)throw erroEntrega("A configuração do frete precisa ser revisada pela biblioteca.",503);
  return valor;
}

export function getLinksEntregasTerceirizadas() {
  return [
    {
      nome: "GAMI Delivery",
      url: process.env.GAMI_DELIVERY_URL || "https://gamidelivery.com.br",
    },
    {
      nome: "99 Entrega",
      url: process.env.NOVENTA_NOVE_ENTREGA_URL || "https://99app.com/passageiro/99-entrega/",
    },
  ];
}

export function freteConfigurado(env=process.env) {
  return Boolean(env.ORS_API_KEY?.trim() && env.STORE_ADDRESS?.trim());
}

async function consultarProvedor(url,options,fetchImpl){
  let response;
  try{response=await fetchImpl(url,options);}catch(error){
    throw erroEntrega(["TimeoutError","AbortError"].includes(error.name)?"O cálculo de frete excedeu o tempo de espera. Tente novamente.":"Não foi possível consultar o frete. Tente novamente mais tarde.",503);
  }
  if(!response.ok)throw erroEntrega("O cálculo de frete está temporariamente indisponível. Tente novamente mais tarde.",503);
  try{return await response.json();}catch{throw erroEntrega("Não foi possível consultar o frete. Tente novamente mais tarde.",503);}
}

async function localizarEndereco(endereco,options,fetchImpl){
  const url=new URL(`${ORS_URL}/pelias/v1/search`);
  url.search=new URLSearchParams({text:endereco,"boundary.country":"BRA",size:"1"});
  const data=await consultarProvedor(url,options,fetchImpl);
  const feature=data?.features?.[0],p=feature?.properties,coordinates=feature?.geometry?.coordinates;
  if(feature?.geometry?.type!=="Point" || !Array.isArray(coordinates) || coordinates.length!==2 ||
    !coordinates.every(Number.isFinite) || Math.abs(coordinates[0])>180 || Math.abs(coordinates[1])>90 ||
    p?.country_a!=="BRA" || !["address","venue","street"].includes(p?.layer) ||
    !Number.isFinite(p?.confidence) || p.confidence<0.8 || typeof p?.label!=="string" || !p.label.trim()){
    throw erroEntrega("Não foi possível localizar o endereço com precisão suficiente. Informe rua, número, cidade, estado e CEP.",422);
  }
  // Pelias can assign confidence=1 to a different nearby venue. Check the requested name as well.
  const normalizar=value=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const termos=normalizar(endereco.split(",")[0]).split(" ").filter(word=>!/^\d+$/.test(word)&&!["rua","avenida","av","r","da","de","do","das","dos"].includes(word));
  const encontrado=new Set(normalizar([p.name,p.street,p.label].filter(Boolean).join(" ")).split(" "));
  if(!termos.length || termos.some(word=>!encontrado.has(word)))throw erroEntrega("O local encontrado não corresponde ao endereço informado. Confira rua, número, cidade, estado e CEP.",422);
  return {coordinates,label:p.label,aproximado:p.layer==="street"};
}

export async function calcularCotacaoEntrega(destino,{env=process.env,fetchImpl=fetch}={}) {
  if(typeof destino!=="string" || !destino.trim() || destino.length>600 || /[\u0000-\u001f\u007f]/.test(destino))throw erroEntrega("Informe um endereço válido com até 600 caracteres.");
  if(!freteConfigurado(env))throw erroEntrega("O cálculo de frete está temporariamente indisponível. Escolha retirada ou tente mais tarde.",503);
  const taxaBase=numeroEnv(env,"DELIVERY_BASE_FEE",5),valorPorKm=numeroEnv(env,"DELIVERY_PRICE_PER_KM",2.5);

  const options={signal:AbortSignal.timeout(15000),headers:{Authorization:env.ORS_API_KEY.trim()}};
  const origem=await localizarEndereco(env.STORE_ADDRESS.trim(),options,fetchImpl);
  const destinoLocalizado=await localizarEndereco(destino.trim(),options,fetchImpl);
  const data=await consultarProvedor(`${ORS_URL}/openrouteservice/v2/directions/driving-car/json`,{
    ...options,
    method: "POST",
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates:[origem.coordinates,destinoLocalizado.coordinates],
      units:"m",instructions:false,geometry:false,
    }),
  },fetchImpl);

  const rota = data?.routes?.[0]?.summary;
  if (!Number.isFinite(rota?.distance) || rota.distance < 0 || !Number.isFinite(rota?.duration) || rota.duration<0) {
    throw erroEntrega("Não foi encontrada uma rota válida. Confira o endereço e tente novamente.",422);
  }

  const distanciaKm = rota.distance / 1000;
  const valorEntrega = taxaBase + distanciaKm * valorPorKm;
  if(!Number.isFinite(valorEntrega)||!Number.isSafeInteger(Math.round(valorEntrega*100)))throw erroEntrega("A configuração do frete precisa ser revisada pela biblioteca.",503);

  return {
    origem: env.STORE_ADDRESS,
    destino: destino.trim(),
    distanciaKm: Number(distanciaKm.toFixed(2)),
    duracao: `${rota.duration}s`,
    valorEntrega: Number(valorEntrega.toFixed(2)),
    provedor:"openrouteservice",
    origemEncontrada:origem.label,
    destinoEncontrado:destinoLocalizado.label,
    localizacaoAproximada:origem.aproximado || destinoLocalizado.aproximado,
  };
}

export async function cotarModalidadeEntrega({modalidadeEntrega="retirada",enderecoEntrega},options){
  if(!["retirada","entrega"].includes(modalidadeEntrega))throw erroEntrega("Modalidade de entrega inválida.");
  if(modalidadeEntrega==="retirada")return {enderecoEntrega:null,valorEntrega:0,distanciaKm:null};
  const cotacao=await calcularCotacaoEntrega(enderecoEntrega,options);
  return {...cotacao,enderecoEntrega:cotacao.destino};
}
