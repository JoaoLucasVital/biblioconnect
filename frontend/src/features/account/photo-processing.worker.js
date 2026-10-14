import {FilesetResolver,ImageSegmenter} from "@mediapipe/tasks-vision";
import {suggestPortraitCrop} from "./portrait-math.js";
import {restrictWorkerNetwork} from "./worker-network.js";
restrictWorkerNetwork(self);
/* Model: Google SelfieMulticlass v1, Apache-2.0; see public/models/portrait-v1/provenance.json. */
self.onmessage=async({data})=>{
  let segmenter,result,bitmap;
  try{
    const {file}=data;
    if(!file||file.size>5*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Escolha uma foto JPG, PNG ou WebP de até 5 MB.");
    self.postMessage({progress:"Preparando foto…"});
    bitmap=await createImageBitmap(file,{imageOrientation:"from-image"});
    if(bitmap.width*bitmap.height>25000000)throw new Error("Escolha uma foto de até 25 megapixels.");
    const scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height)),width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
    const source=new OffscreenCanvas(width,height),context=source.getContext("2d",{willReadFrequently:true});context.drawImage(bitmap,0,0,width,height);bitmap.close();bitmap=null;
    self.postMessage({progress:"Removendo fundo no seu dispositivo…"});
    const root=new URL("/models/portrait-v1/",self.location.origin).href;
    const vision=await FilesetResolver.forVisionTasks(root+"wasm",true);
    segmenter=await ImageSegmenter.createFromOptions(vision,{baseOptions:{modelAssetPath:root+"selfie_multiclass_256x256.tflite",delegate:"CPU"},runningMode:"IMAGE",outputCategoryMask:false,outputConfidenceMasks:true,canvas:new OffscreenCanvas(1,1)});
    result=segmenter.segment(source);
    const masks=result.confidenceMasks;if(masks?.length!==6)throw new Error("Não foi possível identificar as áreas do retrato.");
    const maskWidth=masks[3].width,maskHeight=masks[3].height,face=masks[3].getAsFloat32Array(),crop=suggestPortraitCrop(face,maskWidth,maskHeight);
    const hair=masks[1].getAsFloat32Array(),body=masks[2].getAsFloat32Array(),accessories=masks[5].getAsFloat32Array(),pixels=context.getImageData(0,0,width,height);
    const bounds=crop.face,fw=bounds.right-bounds.left,fh=bounds.bottom-bounds.top;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const nx=x/width,ny=y/height,index=Math.min(maskHeight-1,Math.floor(ny*maskHeight))*maskWidth+Math.min(maskWidth-1,Math.floor(nx*maskWidth));
      const inHead=nx>bounds.left-fw*.85&&nx<bounds.right+fw*.85&&ny>bounds.top-fh*1.25&&ny<bounds.bottom+fh*.35;
      const confidence=inHead?Math.min(1,hair[index]+face[index]+accessories[index]+(ny>bounds.top?body[index]:0)):0;
      pixels.data[(y*width+x)*4+3]=Math.round(255*Math.min(1,Math.max(0,(confidence-.15)/.7)));
    }
    context.putImageData(pixels,0,0);
    const sourceBlob=await source.convertToBlob({type:"image/webp",quality:.94});
    const output=new OffscreenCanvas(512,640),out=output.getContext("2d");out.drawImage(source,crop.x*width,crop.y*height,crop.width*width,crop.height*height,0,0,512,640);
    const blob=await output.convertToBlob({type:"image/webp",quality:.9});
    if(blob.type!=="image/webp"||blob.size>2*1024*1024)throw new Error("Não foi possível gerar uma foto WebP otimizada.");
    self.postMessage({result:{blob,sourceBlob,crop,width,height}});
  }catch(error){if(import.meta.env.DEV)console.error("Portrait runtime:",error.message);self.postMessage({error:error.message?.startsWith("Escolha")||error.message?.startsWith("Não")?error.message:"Não foi possível remover o fundo. Tente outra foto ou tente novamente."});}
  finally{result?.close();segmenter?.close();bitmap?.close();}
};
