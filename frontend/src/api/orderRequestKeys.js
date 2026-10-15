const prefix="bc:order:";
export function createOrderRequestKeys(storage,cryptoImpl=globalThis.crypto){
  const memory=new Map(),pending=new Map();
  const read=key=>{try{return storage?.getItem(key)||memory.get(key);}catch{return memory.get(key);}};
  const write=(key,value)=>{memory.set(key,value);try{storage?.setItem(key,value);}catch{/* blocked storage: retain for this page */}};
  const remove=key=>{memory.delete(key);try{storage?.removeItem(key);}catch{/* no persistent storage */}};
  async function attach(config){
    if(config.method?.toLowerCase()!=="post"||!/^\/(comprar|alugar|reservar)$/.test(config.url)||config.headers?.["Idempotency-Key"])return config;
    const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(config.url+JSON.stringify(config.data)));
    const slot=prefix+Array.from(new Uint8Array(bytes),value=>value.toString(16).padStart(2,"0")).join("");
    // Digest continuations share this synchronous section even for concurrent sends.
    let record;try{record=JSON.parse(read(slot)||"null");}catch{/* invalid old entry */}
    if(!record||Date.now()-record.createdAt>23*3600000){record={id:cryptoImpl.randomUUID(),createdAt:Date.now()};write(slot,JSON.stringify(record));}
    config.headers||={};config.headers["Idempotency-Key"]=record.id;
    config.orderKeySlot=slot;config.orderRequestId=record.id;pending.set(slot,record.id);
    return config;
  }
  function settle(config,finished){
    if(finished&&config?.orderKeySlot&&pending.get(config.orderKeySlot)===config.orderRequestId){remove(config.orderKeySlot);pending.delete(config.orderKeySlot);}
  }
  function clear(){
    try{const slots=Array.from({length:storage?.length||0},(_,index)=>storage.key(index));for(const slot of slots)if(slot?.startsWith(prefix))storage.removeItem(slot);}catch{/* storage unavailable */}
    memory.clear();pending.clear();
  }
  return {attach,settle,clear};
}
