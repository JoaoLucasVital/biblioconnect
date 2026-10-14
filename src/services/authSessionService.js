import {createHash,randomBytes} from "node:crypto";

const DAY=86400000;
export const publicUserSelect={id:true,nome:true,email:true,role:true,emailConfirmado:true,telefone:true,endereco:true,cep:true,rua:true,bairro:true,cidade:true,estado:true,numero:true,complemento:true,pontoReferencia:true};
const userSelect={...publicUserSelect,bloqueado:true,avatarKey:true};
export const hashSessionSecret=secret=>createHash("sha256").update(secret).digest("hex");
const allowed=user=>user && !user.bloqueado && (user.role==="ADMIN"||user.emailConfirmado);
const safeUser=user=>({...Object.fromEntries(Object.keys(publicUserSelect).map(key=>[key,user[key]])),avatarUrl:user.avatarKey?`/me/foto?v=${hashSessionSecret(user.avatarKey).slice(0,12)}`:null});
const validSecret=secret=>typeof secret==="string"&&/^[A-Za-z0-9_-]{43}$/.test(secret);

export async function createSession(prisma,{usuarioId,lembrar=false,now=new Date()}){
  const usuario=await prisma.usuario.findUnique({where:{id:usuarioId},select:userSelect});
  if(!allowed(usuario))throw Object.assign(new Error("Conta indisponível para login"),{status:403});
  const secret=randomBytes(32).toString("base64url");
  const absoluteExpiresAt=new Date(+now+(lembrar?180*DAY:12*3600000));
  const session=await prisma.sessao.create({data:{usuarioId,lembrar:Boolean(lembrar),tokenHash:hashSessionSecret(secret),createdAt:now,lastSeenAt:now,rotatedAt:now,idleExpiresAt:new Date(Math.min(+now+90*DAY,+absoluteExpiresAt)),absoluteExpiresAt}});
  return {id:session.id,secret,lembrar:session.lembrar,idleExpiresAt:session.idleExpiresAt,absoluteExpiresAt,usuario:safeUser(usuario)};
}

export async function resolveSession(prisma,{secret,now=new Date()}){
  if(!validSecret(secret))return null;
  const tokenHash=hashSessionSecret(secret);
  const session=await prisma.sessao.findFirst({where:{revokedAt:null,idleExpiresAt:{gt:now},absoluteExpiresAt:{gt:now},OR:[{tokenHash},{previousTokenHash:tokenHash,previousTokenValidUntil:{gt:now}}]},include:{usuario:{select:userSelect}}});
  if(!session||!allowed(session.usuario))return null;
  let newSecret=null;
  const data={};
  if(+now-+session.lastSeenAt>=5*60000){data.lastSeenAt=now;data.idleExpiresAt=new Date(Math.min(+now+90*DAY,+session.absoluteExpiresAt));}
  if(session.tokenHash===tokenHash&&+now-+session.rotatedAt>=DAY){
    const candidate=randomBytes(32).toString("base64url");
    const result=await prisma.sessao.updateMany({where:{id:session.id,tokenHash,revokedAt:null,rotatedAt:session.rotatedAt},data:{...data,tokenHash:hashSessionSecret(candidate),previousTokenHash:tokenHash,previousTokenValidUntil:new Date(+now+30000),rotatedAt:now}});
    if(result.count===1)newSecret=candidate;
    else{
      const current=await prisma.sessao.findUnique({where:{id:session.id}});
      if(!current||current.revokedAt||+current.idleExpiresAt<=+now||+current.absoluteExpiresAt<=+now)return null;
    }
  }else if(Object.keys(data).length){
    const touched=await prisma.sessao.updateMany({where:{id:session.id,revokedAt:null,lastSeenAt:{lte:new Date(+now-5*60000)}},data});
    if(!touched.count){const current=await prisma.sessao.findUnique({where:{id:session.id}});if(!current||current.revokedAt)return null;}
  }
  return {id:session.id,usuario:safeUser(session.usuario),secret:newSecret,lembrar:session.lembrar,idleExpiresAt:data.idleExpiresAt??session.idleExpiresAt,absoluteExpiresAt:session.absoluteExpiresAt};
}

export async function revokeSession(prisma,{secret,now=new Date()}){
  if(!validSecret(secret))return;
  const tokenHash=hashSessionSecret(secret);
  await prisma.sessao.updateMany({where:{revokedAt:null,OR:[{tokenHash},{previousTokenHash:tokenHash,previousTokenValidUntil:{gt:now}}]},data:{revokedAt:now}});
}

export async function revokeUserSessions(prisma,usuarioId,now=new Date()){
  await prisma.sessao.updateMany({where:{usuarioId,revokedAt:null},data:{revokedAt:now}});
}
