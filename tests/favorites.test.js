import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {createTestDatabase} from "./helpers/database.js";
import {createAuth} from "../src/middleware/auth.js";
import {createQaClient} from "./helpers/qaClient.js";
let favorites,routes;try{favorites=await import("../src/services/favoritesService.js");routes=await import("../src/routes/favoritesRoutes.js");}catch(error){if(error.code!=="ERR_MODULE_NOT_FOUND")throw error;}
async function fixture(prisma){
  const users=await Promise.all([1,2].map(n=>prisma.usuario.create({data:{nome:`Leitor ${n}`,email:`favorite-${n}@example.test`,emailConfirmado:true}})));
  const book=await prisma.livro.create({data:{titulo:"Leitura",autor:"Autora",redator:"Editora",ano:2025,categoria:"Romance",sinopse:"Uma leitura",precoCompra:20,precoAluguel:5,diasInclusos:7,precoDiaExtra:2,estoque:0,disponivel:true}});
  return {users,book};
}
test("favoritos concorrentes são únicos, total é real e só mudança gera evento",async t=>{
  assert.equal(typeof favorites?.setSaved,"function");const {prisma}=await createTestDatabase(t),{users,book}=await fixture(prisma);
  const save=(usuarioId,salvo)=>favorites.setSaved(prisma,{usuarioId,livroId:book.id,salvo});
  await Promise.all([save(users[0].id,true),save(users[0].id,true)]);assert.equal(await prisma.favorito.count(),1);assert.equal(await prisma.eventoFavorito.count(),1);
  const result=await save(users[1].id,true);assert.equal(result.total,2);assert.equal(typeof result.cursor,"string");
  await Promise.all([save(users[0].id,false),save(users[0].id,false)]);assert.equal(await prisma.favorito.count(),1);assert.equal(await prisma.eventoFavorito.count(),3);
  const summary=await favorites.favoriteSummary(prisma,{ids:[book.id],usuarioId:users[1].id});assert.equal(summary.itens[0].total,1);assert.equal(summary.itens[0].salvo,true);
  await prisma.livro.update({where:{id:book.id},data:{disponivel:false}});await assert.rejects(save(users[0].id,true),error=>error.status===404);
  assert.equal((await save(users[1].id,false)).total,0);await assert.rejects(favorites.setSaved(prisma,{usuarioId:users[0].id,livroId:99999,salvo:true}),error=>error.status===404);
});
function streamReader(response){
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="";
  return {async next(type){for(;;){let end;while((end=buffer.indexOf("\n\n"))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const lines=frame.split("\n"),event=lines.find(line=>line.startsWith("event:"))?.slice(6).trim();if(event===type)return JSON.parse(lines.find(line=>line.startsWith("data:"))?.slice(5)||"null");}const value=await reader.read();if(value.done)throw new Error("SSE encerrado antes do evento esperado");buffer+=decoder.decode(value.value,{stream:true});}},close:()=>reader.cancel()};
}
test("duas instâncias SSE convergem e cursor perdido recebe snapshot sem identidade",async t=>{
  assert.equal(typeof routes?.createFavoritesRoutes,"function");const {prisma}=await createTestDatabase(t),{users,book}=await fixture(prisma),servers=[],controllers=[new AbortController(),new AbortController()];
  t.after(async()=>{controllers.forEach(controller=>controller.abort());for(const server of servers)await new Promise(resolve=>server.close(resolve));});
  for(let i=0;i<2;i++){
    const app=express();app.use(express.json());const server=app.listen(0,"127.0.0.1");servers.push(server);await new Promise(resolve=>server.once("listening",resolve));
    const origin=`http://127.0.0.1:${server.address().port}`,auth=createAuth({prisma,secret:"favorite-test-secret-at-least-32-bytes",allowedOrigins:[origin]});
    app.post("/test-login",auth.requireOrigin,async(req,res)=>auth.signIn(res,{usuarioId:users[0].id}));app.use(routes.createFavoritesRoutes({prisma,auth}));server.origin=origin;
  }
  const one=createQaClient(servers[0].origin),anonymous=createQaClient(servers[1].origin);await one.request("/test-login",{method:"POST"});await anonymous.request(`/livros/${book.id}/salvo`,{method:"PUT",body:{salvo:true},status:401});
  const streams=await Promise.all(servers.map(async(server,index)=>streamReader(await fetch(`${server.origin}/livros/salvos/eventos?ids=${book.id}&cursor=0`,{signal:controllers[index].signal}))));
  await Promise.all(streams.map(stream=>stream.next("snapshot")));
  const start=Date.now();await one.request(`/livros/${book.id}/salvo`,{method:"PUT",body:{salvo:true}});
  const updates=await Promise.all(streams.map(stream=>stream.next("favorite")));assert.ok(Date.now()-start<2000);for(const update of updates){assert.equal(update.total,1);assert.equal(update.usuarioId,undefined);assert.equal(update.email,undefined);}
  await Promise.all(streams.map(stream=>stream.close()));
  const reconnect=streamReader(await fetch(`${servers[1].origin}/livros/salvos/eventos?ids=${book.id}&cursor=999999`,{signal:AbortSignal.timeout(5000)}));const snapshot=await reconnect.next("snapshot");assert.equal(snapshot.itens[0].total,1);assert.equal(snapshot.itens[0].salvo,undefined);await reconnect.close();
  const mine=await one.request("/me/salvos");assert.equal(mine.itens[0].id,book.id);await anonymous.request("/me/salvos",{status:401});await anonymous.request("/livros/salvos/resumo?ids=abc",{status:400});
});
