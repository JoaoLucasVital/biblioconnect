import {randomBytes,createHash} from "node:crypto";
const settings={confirmation:{hash:"tokenConfirmacaoHash",legacy:"tokenConfirmacaoEmail",expires:"tokenConfirmacaoExpira",ttl:86400000},reset:{hash:"tokenResetSenhaHash",legacy:"tokenResetSenha",expires:"tokenResetSenhaExpira",ttl:1800000}};
const hash=value=>createHash("sha256").update(value).digest("hex");
function config(purpose){if(!settings[purpose])throw new Error("Finalidade de token inválida.");return settings[purpose];}
export async function issueAccountToken(prisma,{usuarioId,purpose,now=new Date()}){
  const item=config(purpose),token=randomBytes(32).toString("hex"),expiresAt=new Date(+now+item.ttl);
  await prisma.usuario.update({where:{id:usuarioId},data:{[item.hash]:hash(token),[item.legacy]:null,[item.expires]:expiresAt}});
  return {token,expiresAt};
}
export async function consumeAccountToken(prisma,{token,purpose,now=new Date()}){
  const item=config(purpose);
  if(typeof token!=="string"||!/^[a-f0-9]{64}$/.test(token))return null;
  // The legacy writer has been removed. Old links retain only their existing,
  // bounded expiry; consuming one always clears the old plaintext field.
  const where={ [item.expires]:{gt:now,lte:new Date(+now+item.ttl)},OR:[{[item.hash]:hash(token)},{[item.hash]:null,[item.legacy]:token}]};
  const user=await prisma.usuario.findFirst({where,select:{id:true,nome:true,email:true}});
  if(!user)return null;
  const result=await prisma.usuario.updateMany({where:{id:user.id,...where},data:{[item.hash]:null,[item.legacy]:null,[item.expires]:null,...(purpose==="confirmation"?{emailConfirmado:true}:{})}});
  return result.count===1?user:null;
}
