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
    let width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale)),type="image/webp";
    for(let attempt=0;attempt<3;attempt++){
      const canvas=new OffscreenCanvas(width,height);
      canvas.getContext("2d").drawImage(bitmap,0,0,width,height);
      let blob;
      try{blob=await canvas.convertToBlob({type,quality:.9});}
      catch(error){
        if(type!=="image/webp")throw error;
        type="image/png";blob=await canvas.convertToBlob({type});
      }
      // Safari can return PNG when WebP encoding is unavailable. The server
      // validates the bytes, removes metadata and stores the final image as WebP.
      if(!blob?.size||!["image/webp","image/png","image/jpeg"].includes(blob.type))throw new Error("Não foi possível preparar a foto. Tente outra imagem.");
      canvas.width=0;canvas.height=0;
      if(blob.size<=2*1024*1024){self.postMessage({result:{blob,width,height}});return;}
      type=blob.type;width=Math.max(1,Math.round(width*.75));height=Math.max(1,Math.round(height*.75));
    }
    throw new Error("Não foi possível reduzir a foto para até 2 MB. Tente uma foto menor.");
  }catch(error){self.postMessage({error:error.message?.startsWith("Escolha")||error.message?.startsWith("Não")?error.message:"Não foi possível abrir a foto. Escolha uma imagem válida e tente novamente."});}
  finally{bitmap?.close();}
};
