// Resize/re-encode only: keep the full frame and its original background.
self.onmessage=async({data})=>{
  let bitmap;
  try{
    const {file}=data;
    if(!file||file.size>5*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Escolha uma foto JPG, PNG ou WebP de até 5 MB.");
    self.postMessage({progress:"Otimizando a foto completa…"});
    bitmap=await createImageBitmap(file,{imageOrientation:"from-image"});
    if(bitmap.width*bitmap.height>25000000)throw new Error("Escolha uma foto de até 25 megapixels.");
    const scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));
    const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=new OffscreenCanvas(width,height);
    canvas.getContext("2d").drawImage(bitmap,0,0,width,height);
    const blob=await canvas.convertToBlob({type:"image/webp",quality:.9});
    if(blob.type!=="image/webp"||blob.size>2*1024*1024)throw new Error("Não foi possível gerar uma foto WebP otimizada.");
    self.postMessage({result:{blob,width,height}});
  }catch(error){self.postMessage({error:error.message?.startsWith("Escolha")||error.message?.startsWith("Não")?error.message:"Não foi possível abrir a foto. Escolha uma imagem válida e tente novamente."});}
  finally{bitmap?.close();}
};
