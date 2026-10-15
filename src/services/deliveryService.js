/**
 * Cotação de entrega usando Google Maps Routes API.
 * A taxa é calculada por valor base + valor por quilômetro, ambos configuráveis.
 */
const GOOGLE_ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

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

export function mapsConfigurado() {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY && process.env.STORE_ADDRESS);
}

export async function calcularCotacaoEntrega(destino,{env=process.env,fetchImpl=fetch}={}) {
  if(typeof destino!=="string" || !destino.trim() || destino.length>600 || /[\u0000-\u001f\u007f]/.test(destino))throw erroEntrega("Informe um endereço válido com até 600 caracteres.");
  if(!env.GOOGLE_MAPS_API_KEY?.trim()||!env.STORE_ADDRESS?.trim())throw erroEntrega("O cálculo de frete está temporariamente indisponível. Escolha retirada ou tente mais tarde.",503);
  const taxaBase=numeroEnv(env,"DELIVERY_BASE_FEE",5),valorPorKm=numeroEnv(env,"DELIVERY_PRICE_PER_KM",2.5);

  let response;
  try{response = await fetchImpl(GOOGLE_ROUTES_URL, {
    signal: AbortSignal.timeout(15000),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: { address: env.STORE_ADDRESS },
      destination: { address: destino.trim() },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      languageCode: "pt-BR",
      units: "METRIC",
    }),
  });}catch(error){throw erroEntrega(["TimeoutError","AbortError"].includes(error.name)?"O cálculo de frete excedeu o tempo de espera. Tente novamente.":"Não foi possível consultar o frete. Tente novamente mais tarde.",503);}

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw erroEntrega("O cálculo de frete está temporariamente indisponível. Tente novamente mais tarde.",503);
  }

  const rota = data?.routes?.[0];
  if (!Number.isFinite(rota?.distanceMeters) || rota.distanceMeters < 0 || !/^\d+(\.\d+)?s$/.test(rota?.duration||"")) {
    throw erroEntrega("Não foi encontrada uma rota válida. Confira o endereço e tente novamente.",422);
  }

  const distanciaKm = rota.distanceMeters / 1000;
  const valorEntrega = taxaBase + distanciaKm * valorPorKm;
  if(!Number.isFinite(valorEntrega)||!Number.isSafeInteger(Math.round(valorEntrega*100)))throw erroEntrega("A configuração do frete precisa ser revisada pela biblioteca.",503);

  return {
    origem: env.STORE_ADDRESS,
    destino: destino.trim(),
    distanciaKm: Number(distanciaKm.toFixed(2)),
    duracao: rota.duration || null,
    valorEntrega: Number(valorEntrega.toFixed(2)),
  };
}

export async function cotarModalidadeEntrega({modalidadeEntrega="retirada",enderecoEntrega},options){
  if(!["retirada","entrega"].includes(modalidadeEntrega))throw erroEntrega("Modalidade de entrega inválida.");
  if(modalidadeEntrega==="retirada")return {enderecoEntrega:null,valorEntrega:0,distanciaKm:null};
  const cotacao=await calcularCotacaoEntrega(enderecoEntrega,options);
  return {...cotacao,enderecoEntrega:cotacao.destino};
}
