import {createHash} from "node:crypto";
import {erroNegocio} from "./orderService.js";
const hash=value=>createHash("sha256").update(value).digest("hex");
function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,canonical(value[key])]));
  return value;
}
export function orderOperation({usuarioId,scope,key,input}){
  if(typeof key!=="string"||!key.length||key.length>128||!/^[\x21-\x7e]+$/.test(key))throw erroNegocio("Identificador da operação inválido.");
  return {usuarioId,scope,keyHash:hash(key),fingerprint:hash(JSON.stringify(canonical(input)))};
}
const whereFor=operation=>({usuarioId_scope_keyHash:{usuarioId:operation.usuarioId,scope:operation.scope,keyHash:operation.keyHash}});
function assertFingerprint(record,operation){if(record&&record.fingerprint!==operation.fingerprint)throw erroNegocio("Esta operação já foi usada com outros dados. Inicie uma nova solicitação.",409);}
export async function readIdempotentOrder(prisma,operation){
  if(!operation)return null;
  const record=await prisma.operacaoIdempotente.findUnique({where:whereFor(operation)});
  assertFingerprint(record,operation);
  if(record?.state!=="concluida")return null;
  const pedido=await prisma.pedido.findUnique({where:{id:record.resultadoId},include:{livro:true}});
  if(!pedido||pedido.usuarioId!==operation.usuarioId)throw erroNegocio("O resultado desta operação não está mais disponível.",409);
  return pedido;
}
/** Only database work belongs inside this transaction: no email or gateway calls. */
export async function runIdempotentOrder(tx,operation,create){
  if(!operation)return create();
  await tx.operacaoIdempotente.createMany({data:[{...operation,expiresAt:new Date(Date.now()+24*3600000)}],skipDuplicates:true});
  const record=await tx.operacaoIdempotente.findUnique({where:whereFor(operation)});
  await tx.$queryRaw`SELECT id FROM "OperacaoIdempotente" WHERE id = ${record.id} FOR UPDATE`;
  const current=await tx.operacaoIdempotente.findUnique({where:{id:record.id}});
  assertFingerprint(current,operation);
  if(current.state==="concluida")return readIdempotentOrder(tx,operation);
  const pedido=await create();
  await tx.operacaoIdempotente.update({where:{id:current.id},data:{state:"concluida",resultadoId:pedido.id}});
  return pedido;
}
