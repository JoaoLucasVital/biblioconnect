import fs from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
const safeKey=key=>typeof key==="string"&&/^avatars\/[1-9]\d*\/[a-f0-9-]{36}\.webp$/.test(key);
export function createMediaStorage({env=process.env,localDirectory=env.AVATAR_STORAGE_DIR||path.resolve(".local/avatars")}={}){
  const directory=path.resolve(localDirectory);
  async function blob(){return import("@vercel/blob");}
  const options=()=>({access:"private",...(env.BLOB_PRIVATE_READ_WRITE_TOKEN?{token:env.BLOB_PRIVATE_READ_WRITE_TOKEN}:{}),...(env.BLOB_PRIVATE_STORE_ID?{storeId:env.BLOB_PRIVATE_STORE_ID}:{}),...(env.VERCEL_OIDC_TOKEN?{oidcToken:env.VERCEL_OIDC_TOKEN}:{})});
  function filePath(key){
    if(!safeKey(key))throw new Error("Chave de imagem inválida.");
    const target=path.resolve(directory,...key.split("/"));
    if(!target.startsWith(directory+path.sep))throw new Error("Caminho de imagem inválido.");return target;
  }
  function localAllowed(){if(env.NODE_ENV==="production"||env.VERCEL)throw new Error("Armazenamento persistente privado precisa ser configurado.");}
  return {
    async saveAvatar({usuarioId,bytes}){
      if(!Number.isSafeInteger(usuarioId)||usuarioId<1)throw new Error("Usuário inválido.");
      const key=`avatars/${usuarioId}/${randomUUID()}.webp`;
      if(env.MEDIA_STORAGE==="blob"){
        const {put}=await blob();await put(key,bytes,{...options(),contentType:"image/webp",addRandomSuffix:false});return key;
      }
      localAllowed();const target=filePath(key);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes,{flag:"wx"});return key;
    },
    async readAvatar({key}){
      if(!safeKey(key))return null;
      if(env.MEDIA_STORAGE==="blob"){
        const {get}=await blob(),result=await get(key,options());if(!result||result.statusCode!==200)return null;
        return Buffer.from(await new Response(result.stream).arrayBuffer());
      }
      localAllowed();try{return await fs.readFile(filePath(key));}catch(error){if(error.code==="ENOENT")return null;throw error;}
    },
    async deleteAvatar({key}){
      if(!safeKey(key))return;
      if(env.MEDIA_STORAGE==="blob"){const {del}=await blob();await del(key,options());return;}
      localAllowed();await fs.rm(filePath(key),{force:true});
    },
  };
}
