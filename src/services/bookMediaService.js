import {randomUUID} from 'node:crypto';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';

export const bookImageLimit=5*1024*1024;
const badUpload=()=>Object.assign(new Error('Upload inválido ou expirado. Selecione a capa novamente.'),{status:400});
export async function sanitizeBookCover(bytes){
  if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>bookImageLimit)throw badUpload();
  try{
    const image=sharp(bytes,{limitInputPixels:25_000_000,animated:false}),meta=await image.metadata();
    if(!['jpeg','png','webp'].includes(meta.format)||(meta.pages||1)>1)throw badUpload();
    return await image.rotate().resize({width:1600,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toBuffer();
  }catch{throw badUpload();}
}
export function createBookMediaService({env=process.env,sdk}={}){
  const storage=async()=>sdk||import('@vercel/blob');
  const privateOptions=()=>({access:'private',...(env.BLOB_PRIVATE_STORE_ID?{storeId:env.BLOB_PRIVATE_STORE_ID}:{}),...(env.BLOB_PRIVATE_READ_WRITE_TOKEN?{token:env.BLOB_PRIVATE_READ_WRITE_TOKEN}:{}),...(env.VERCEL_OIDC_TOKEN?{oidcToken:env.VERCEL_OIDC_TOKEN}:{})});
  const publicOptions=()=>({access:'public',...(env.BLOB_STORE_ID?{storeId:env.BLOB_STORE_ID}:{}),...(env.BLOB_READ_WRITE_TOKEN?{token:env.BLOB_READ_WRITE_TOKEN}:{})});
  function claims(usuarioId,ticket){
    try{
      const payload=jwt.verify(ticket,env.AUTH_SECRET,{algorithms:['HS256'],audience:'book-upload',issuer:'biblioconnect'});
      if(payload.sub!==String(usuarioId)||!new RegExp(`^book-staging/${usuarioId}/[a-f0-9-]{36}$`).test(payload.pathname))throw badUpload();return payload;
    }catch{throw badUpload();}
  }
  return {
    async cleanupStaged(){
      if(env.MEDIA_STORAGE!=='blob')return 0;
      const blob=await storage(),result=await blob.list({...privateOptions(),prefix:'book-staging/',limit:1000});
      const expired=result.blobs.filter(item=>/^book-staging\/[1-9]\d*\/[a-f0-9-]{36}$/.test(item.pathname)&&+new Date(item.uploadedAt)<Date.now()-3600000).map(item=>item.pathname);
      if(expired.length)await blob.del(expired,privateOptions());return expired.length;
    },
    prepare(usuarioId){
      if(env.MEDIA_STORAGE!=='blob')return {mode:'local'};
      if(!Number.isSafeInteger(usuarioId)||usuarioId<1||!env.AUTH_SECRET||env.AUTH_SECRET.length<32)throw badUpload();
      const pathname=`book-staging/${usuarioId}/${randomUUID()}`;
      const ticket=jwt.sign({pathname},env.AUTH_SECRET,{algorithm:'HS256',subject:String(usuarioId),audience:'book-upload',issuer:'biblioconnect',expiresIn:'10m'});
      return {mode:'blob',pathname,ticket};
    },
    async authorize(usuarioId,pathname,ticket){
      const payload=claims(usuarioId,ticket);if(payload.pathname!==pathname)throw badUpload();
      const {issueSignedToken}=await storage();
      return {token:await issueSignedToken({...privateOptions(),operations:['put'],pathname,validUntil:payload.exp*1000,allowedContentTypes:['image/jpeg','image/png','image/webp'],maximumSizeInBytes:bookImageLimit}),urlOptions:{access:'private',addRandomSuffix:false,allowOverwrite:false}};
    },
    async finalize(usuarioId,ticket){
      const {pathname}=claims(usuarioId,ticket),blob=await storage();
      const result=await blob.get(pathname,privateOptions());if(result?.statusCode!==200)throw badUpload();
      let bytes;
      try{
        const reader=result.stream.getReader(),parts=[];let size=0;
        try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>bookImageLimit)throw badUpload();parts.push(value);}}finally{await reader.cancel();}
        bytes=await sanitizeBookCover(Buffer.concat(parts));
      }catch(error){await blob.del(pathname,privateOptions()).catch(()=>{});throw error;}
      const key=`livros/${usuarioId}/${randomUUID()}.webp`;
      const published=await blob.put(key,bytes,{...publicOptions(),addRandomSuffix:false,allowOverwrite:false,contentType:'image/webp'});
      await blob.del(pathname,privateOptions()).catch(()=>{});
      return {imagemUrl:published.url};
    },
  };
}
