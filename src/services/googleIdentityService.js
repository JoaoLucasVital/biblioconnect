import {createRequire} from "node:module";
import {publicUserSelect} from "./authSessionService.js";
const require=createRequire(import.meta.url);
const unavailable=()=>Object.assign(new Error("Conta indisponível para login."),{status:403});
export function googleAuthConfigured(clientId){
  if(!/^.+\.apps\.googleusercontent\.com$/.test(clientId||""))return false;
  try{require.resolve("google-auth-library");return true;}catch{return false;}
}
export async function verifyGoogleCredential(credential,{clientId,nonce,client,now=new Date()}){
  if(typeof credential!=="string"||!credential||credential.length>16000||!clientId||!nonce)throw Object.assign(new Error("Credencial Google inválida."),{status:401});
  if(!client){
    try{const {OAuth2Client}=await import("google-auth-library");client=new OAuth2Client();}
    catch{throw Object.assign(new Error("Login Google ainda não configurado."),{status:503});}
  }
  try{
    const ticket=await client.verifyIdToken({idToken:credential,audience:clientId});
    const claims=ticket.getPayload();
    if(!["accounts.google.com","https://accounts.google.com"].includes(claims?.iss)||claims.aud!==clientId||claims.nonce!==nonce||!Number.isFinite(claims.exp)||claims.exp<=+now/1000||!claims.sub||claims.sub.length>255||claims.email_verified!==true||typeof claims.email!=="string"||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email)||claims.email.length>254)throw new Error("invalid claims");
    return claims;
  }catch{throw Object.assign(new Error("Credencial Google inválida."),{status:401});}
}

export async function resolveGoogleIdentity(prisma,{claims,authenticatedUserId}){
  const email=claims.email.trim().toLowerCase(),subject=String(claims.sub);
  const authoritative=claims.email_verified===true&&(email.endsWith("@gmail.com")||Boolean(claims.hd));
  async function resolve(tx){
    const identity=await tx.identidadeExterna.findUnique({where:{provider_subject:{provider:"google",subject}},include:{usuario:{select:{...publicUserSelect,bloqueado:true}}}});
    if(identity){
      if(identity.usuario.bloqueado)throw unavailable();
      if(authenticatedUserId&&identity.usuarioId!==authenticatedUserId)return {usuario:null,needsAccountLink:true,needsEmailConfirmation:false};
      const {bloqueado,...usuario}=identity.usuario;
      return {usuario,needsAccountLink:false,needsEmailConfirmation:!usuario.emailConfirmado};
    }
    const existing=await tx.usuario.findUnique({where:{email},select:{...publicUserSelect,bloqueado:true}});
    if(existing){
      if(existing.bloqueado)throw unavailable();
      if(existing.id!==authenticatedUserId||!existing.emailConfirmado)return {usuario:null,needsAccountLink:true,needsEmailConfirmation:false};
      await tx.identidadeExterna.create({data:{provider:"google",subject,usuarioId:existing.id}});
      const {bloqueado,...usuario}=existing;
      return {usuario,needsAccountLink:false,needsEmailConfirmation:false};
    }
    if(authenticatedUserId)return {usuario:null,needsAccountLink:true,needsEmailConfirmation:false};
    const usuario=await tx.usuario.create({data:{nome:String(claims.name||"Leitor").trim().slice(0,120)||"Leitor",email,senha:null,role:"CLIENTE",emailConfirmado:authoritative,identidades:{create:{provider:"google",subject}}},select:publicUserSelect});
    return {usuario,needsAccountLink:false,needsEmailConfirmation:!authoritative};
  }
  try{return await prisma.$transaction(resolve);}catch(error){
    if(error.code==="P2002")return prisma.$transaction(resolve);
    throw error;
  }
}
