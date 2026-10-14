import {createHmac} from "node:crypto";

export async function consumeRateLimit(prisma,{scope,key,limit,windowMs,now=new Date(),secret=process.env.AUTH_SECRET}){
  if(!secret||Buffer.byteLength(secret)<32)throw new Error("Segredo de autenticação precisa ter pelo menos 32 bytes");
  if(!Number.isSafeInteger(limit)||limit<1||!Number.isSafeInteger(windowMs)||windowMs<1||!Number.isFinite(+now))throw new Error("Limite de operação inválido");
  const windowStart=new Date(Math.floor(+now/windowMs)*windowMs),expiresAt=new Date(+windowStart+windowMs);
  const keyHash=createHmac("sha256",secret).update(JSON.stringify([scope,String(key)])).digest("hex");
  const value=await prisma.limiteOperacao.upsert({where:{scope_keyHash_windowStart:{scope,keyHash,windowStart}},create:{scope,keyHash,windowStart,expiresAt,count:1},update:{count:{increment:1}}});
  return {allowed:value.count<=limit,retryAfterSeconds:Math.max(1,Math.ceil((+expiresAt-+now)/1000))};
}
