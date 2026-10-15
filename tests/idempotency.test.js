import test from "node:test";
import assert from "node:assert/strict";
import {createTestDatabase} from "./helpers/database.js";
import {orderOperation,readIdempotentOrder} from "../src/services/idempotencyService.js";
import {criarPedidoComEstoque} from "../src/services/orderService.js";

test("same operation is atomic across retries, conflicts and concurrent requests",async t=>{
  const {prisma}=await createTestDatabase(t);
  const user=await prisma.usuario.create({data:{nome:"Leitor",email:"idem@example.test",emailConfirmado:true}});
  const book=await prisma.livro.create({data:{titulo:"Teste",autor:"Autor",categoria:"Teste",ano:2025,redator:"Editora",sinopse:"Teste",precoCompra:20,precoAluguel:5,precoDiaExtra:2,diasInclusos:7,estoque:2}});
  const data={tipo:"compra",status:"pendente",statusPagamento:"pendente",valor:20,retiradaLimite:new Date(Date.now()+86400000),usuarioId:user.id,livroId:book.id};
  const input={livroId:book.id,modalidadeEntrega:"retirada"};
  const operation=orderOperation({usuarioId:user.id,scope:"compra",key:"unique-client-request-1",input});
  const [firstOrder,retryOrder]=await Promise.all([1,2].map(()=>criarPedidoComEstoque(prisma,data,operation)));
  assert.equal(firstOrder.id,retryOrder.id);assert.equal((await prisma.livro.findUnique({where:{id:book.id}})).estoque,1);
  assert.equal(await prisma.pedido.count(),1);assert.equal((await readIdempotentOrder(prisma,operation)).id,firstOrder.id);
  const conflicting=orderOperation({usuarioId:user.id,scope:"compra",key:"unique-client-request-1",input:{...input,modalidadeEntrega:"entrega"}});
  await assert.rejects(criarPedidoComEstoque(prisma,data,conflicting),e=>e.status===409);
  assert.equal((await prisma.livro.findUnique({where:{id:book.id}})).estoque,1);
  const record=await prisma.operacaoIdempotente.findFirst();assert.ok(!JSON.stringify(record).includes("unique-client-request-1"));
  const different=orderOperation({usuarioId:user.id,scope:"compra",key:"another-request",input});
  await criarPedidoComEstoque(prisma,data,different);
  const unavailable=orderOperation({usuarioId:user.id,scope:"compra",key:"out-of-stock-request",input});
  await assert.rejects(criarPedidoComEstoque(prisma,data,unavailable),e=>e.status===409);
  assert.equal(await readIdempotentOrder(prisma,unavailable),null);
  assert.equal(await prisma.operacaoIdempotente.count(),2);
  assert.equal((await readIdempotentOrder(prisma,operation)).id,firstOrder.id);
});
test("operation validates key and canonicalizes object ordering without reusing another user",()=>{
  const args={usuarioId:1,scope:"compra",key:"valid-key",input:{b:2,a:1}};
  assert.equal(orderOperation(args).fingerprint,orderOperation({...args,input:{a:1,b:2}}).fingerprint);
  assert.notEqual(orderOperation(args).usuarioId,orderOperation({...args,usuarioId:2}).usuarioId);
  for(const key of ["",123,"x".repeat(129),"a\nb"])assert.throws(()=>orderOperation({...args,key}),e=>e.status===400);
});
