import test from "node:test";
import assert from "node:assert/strict";
import {createTestDatabase} from "./helpers/database.js";
import {createRuntimeJobs} from "../src/services/runtimeJobs.js";
test("reminders are claimed once across workers, failure retries and durable event retention is bounded",async t=>{
  const {prisma}=await createTestDatabase(t),now=new Date("2026-10-14T12:00:00Z"),yesterday=new Date(+now-2*86400000);
  const user=await prisma.usuario.create({data:{nome:"Leitor",email:"jobs@example.test"}});
  const book=await prisma.livro.create({data:{titulo:"Teste",autor:"Autor",categoria:"Teste",ano:2025,redator:"Editora",sinopse:"Teste",precoCompra:20,precoAluguel:5,precoDiaExtra:2,diasInclusos:7,estoque:2}});
  const order=await prisma.pedido.create({data:{usuarioId:user.id,livroId:book.id,tipo:"aluguel",status:"pendente",statusPagamento:"pago",valor:5,retiradaLimite:yesterday,devolucaoPrevista:yesterday}});
  await prisma.eventoFavorito.createMany({data:[{livroId:book.id,total:1,createdAt:yesterday},{livroId:book.id,total:2,createdAt:now}]});
  const failedJob=createRuntimeJobs({prisma,clock:()=>now,calcularMultaPedido:()=>2,enviarNotificacao:async()=>false});
  const failed=await failedJob.run();assert.equal(failed.notified,0);assert.equal(failed.failed,1);
  assert.equal((await prisma.pedido.findUnique({where:{id:order.id}})).ultimaNotificacaoAtraso,null);
  let sends=0;const job=createRuntimeJobs({prisma,clock:()=>now,calcularMultaPedido:()=>2,enviarNotificacao:async()=>{sends++;return true;}});
  await Promise.all([job.run(),job.run()]);assert.equal(sends,1);await job.run();assert.equal(sends,1);
  assert.equal(await prisma.eventoFavorito.count(),1);
  assert.equal((await prisma.eventoFavorito.findFirst()).total,2);
});
