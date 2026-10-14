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
export async function cropPortrait(sourceBlob,crop,{zoom=1,x=0,y=0}={}){
  const bitmap=await createImageBitmap(sourceBlob),canvas=document.createElement("canvas");canvas.width=512;canvas.height=640;
  const width=crop.width*bitmap.width/zoom,height=crop.height*bitmap.height/zoom;
  const sx=Math.max(0,Math.min(bitmap.width-width,(crop.x+crop.width/2)*bitmap.width-width/2+x*bitmap.width*.3));
  const sy=Math.max(0,Math.min(bitmap.height-height,(crop.y+crop.height/2)*bitmap.height-height/2+y*bitmap.height*.3));
  canvas.getContext("2d").drawImage(bitmap,sx,sy,width,height,0,0,512,640);bitmap.close();
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?.type==="image/webp"?resolve(blob):reject(new Error("Não foi possível ajustar a foto.")),"image/webp",.9));
}
