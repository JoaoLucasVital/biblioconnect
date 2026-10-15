export function processPortrait(file,{signal,onProgress}={}){
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(new DOMException("Cancelado","AbortError"));return;}
    const worker=new Worker(new URL("./photo-processing.worker.js",import.meta.url),{type:"module"});
    const cleanup=()=>{worker.terminate();clearTimeout(timer);signal?.removeEventListener("abort",cancel);};
    const cancel=()=>{cleanup();reject(new DOMException("Cancelado","AbortError"));};
    const timer=setTimeout(()=>{cleanup();reject(new Error("O processamento demorou mais que o esperado. Tente uma foto menor."));},90000);
    signal?.addEventListener("abort",cancel,{once:true});
    worker.onmessage=({data})=>{if(data.progress)onProgress?.(data.progress);if(data.error){cleanup();reject(new Error(data.error));}if(data.result){cleanup();resolve(data.result);}};
    worker.onerror=()=>{cleanup();reject(new Error("Não foi possível processar a foto neste navegador."));};worker.postMessage({file});
  });
}
