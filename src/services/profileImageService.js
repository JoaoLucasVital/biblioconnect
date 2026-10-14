import sharp from "sharp";
export async function sanitizeProfileImage(bytes){
  if(!Buffer.isBuffer(bytes)||!bytes.length)throw Object.assign(new Error("Envie uma imagem válida."),{status:400});
  if(bytes.length>2*1024*1024)throw Object.assign(new Error("A foto processada deve ter até 2 MB."),{status:413});
  try{
    const image=sharp(bytes,{limitInputPixels:4000000,failOn:"warning",animated:false});
    const info=await image.metadata();
    if(!["jpeg","png","webp"].includes(info.format)||!info.width||!info.height||(info.pages||1)>1)throw new Error("format");
    return await image.rotate().resize({width:640,height:800,fit:"inside",withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toBuffer();
  }catch{throw Object.assign(new Error("A foto é inválida ou excede o limite de resolução."),{status:400});}
}
