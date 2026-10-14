import {createHash} from "node:crypto";
import {publicUserSelect} from "./authSessionService.js";
export const profileSelect={...publicUserSelect,avatarKey:true};
const editable={nome:120,telefone:24,cep:9,rua:180,bairro:100,cidade:100,estado:2,numero:20,complemento:180,pontoReferencia:200};
export function presentProfile(user){
  const {avatarKey,...profile}=user;
  return {...profile,avatarUrl:avatarKey?`/me/foto?v=${createHash("sha256").update(avatarKey).digest("hex").slice(0,12)}`:null};
}
export async function updateProfile(prisma,{usuarioId,data}){
  if(!data||Array.isArray(data)||typeof data!=="object"||Object.keys(data).some(key=>!Object.hasOwn(editable,key)))throw Object.assign(new Error("Envie somente os campos editáveis do seu perfil."),{status:400});
  const changes={};
  for(const [key,value] of Object.entries(data)){
    if(typeof value!=="string"||value.trim().length>editable[key]||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw Object.assign(new Error("Confira os dados do perfil."),{status:400});
    changes[key]=value.trim();
  }
  if(Object.hasOwn(changes,"nome")&&!changes.nome)throw Object.assign(new Error("Informe seu nome."),{status:400});
  if(changes.estado){if(!/^[a-z]{2}$/i.test(changes.estado))throw Object.assign(new Error("Informe uma UF válida."),{status:400});changes.estado=changes.estado.toUpperCase();}
  if(changes.cep){changes.cep=changes.cep.replace(/\D/g,"");if(changes.cep.length!==8)throw Object.assign(new Error("Informe um CEP válido."),{status:400});}
  return prisma.$transaction(async tx=>{
    const current=await tx.usuario.findUnique({where:{id:usuarioId},select:profileSelect});
    const merged={...current,...changes};
    changes.endereco=[merged.rua,merged.numero,merged.bairro,merged.cidade,merged.estado,merged.cep,merged.complemento,merged.pontoReferencia].filter(Boolean).join(", ");
    return presentProfile(await tx.usuario.update({where:{id:usuarioId},data:changes,select:profileSelect}));
  });
}
