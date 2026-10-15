import {beforeEach,afterEach,expect,it,vi} from "vitest";

let bitmap,canvases;
beforeEach(()=>{
  vi.resetModules();
  bitmap={width:1600,height:1200,close:vi.fn()};canvases=[];
  vi.stubGlobal("self",{postMessage:vi.fn()});
  vi.stubGlobal("createImageBitmap",vi.fn().mockResolvedValue(bitmap));
});
afterEach(()=>vi.unstubAllGlobals());

async function processPhoto(encode){
  vi.stubGlobal("OffscreenCanvas",class{
    constructor(width,height){this.width=width;this.height=height;canvases.push(this);}
    getContext(){return {drawImage:vi.fn()};}
    convertToBlob(options){return encode(options,this);}
  });
  await import("./photo-processing.worker.js");
  await self.onmessage({data:{file:new File(["photo"],"photo.jpeg",{type:"image/jpeg"})}});
  return self.postMessage.mock.calls.map(([message])=>message);
}

it("aceita PNG quando o navegador não codifica WebP, preservando o quadro completo",async()=>{
  const png=new Blob(["encoded png"],{type:"image/png"});
  const messages=await processPhoto(async()=>png);
  expect(messages.find(message=>message.error)).toBeUndefined();
  expect(messages.find(message=>message.result)?.result).toEqual({blob:png,width:1024,height:768});
  expect(bitmap.close).toHaveBeenCalledOnce();
});

it("reduz PNG sem cortar a imagem quando o resultado ultrapassa o limite de upload",async()=>{
  const messages=await processPhoto(async(_options,canvas)=>new Blob([
    canvas.width===1024?new Uint8Array(2*1024*1024+1):"smaller png",
  ],{type:"image/png"}));
  const result=messages.find(message=>message.result)?.result;
  expect(messages.find(message=>message.error)).toBeUndefined();
  expect(result).toBeDefined();
  expect(result.width).toBeLessThan(1024);
  expect(result.width/result.height).toBeCloseTo(4/3);
  expect(result.blob.size).toBeLessThanOrEqual(2*1024*1024);
});

it("tenta PNG se a codificação WebP lançar erro",async()=>{
  const png=new Blob(["encoded png"],{type:"image/png"});
  const messages=await processPhoto(async({type})=>{
    if(type==="image/webp")throw new DOMException("Unsupported encoder","EncodingError");
    return png;
  });
  expect(messages.find(message=>message.error)).toBeUndefined();
  expect(messages.find(message=>message.result)?.result.blob).toBe(png);
});

it("mantém WebP quando o navegador suporta o formato",async()=>{
  const webp=new Blob(["encoded webp"],{type:"image/webp"});
  const messages=await processPhoto(async()=>webp);
  expect(messages.find(message=>message.result)?.result.blob).toBe(webp);
});
