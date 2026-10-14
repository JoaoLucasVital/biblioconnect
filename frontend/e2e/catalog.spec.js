import {sessionCredentials} from "./helpers.js";
import { test, expect } from "@playwright/test";
import { createConfirmedClient, createBook, loginUi } from "./helpers.js";
async function bookFor(request,overrides={}) {
  const login=await request.post(`${process.env.QA_API_URL}/login`,{headers:{Origin:process.env.QA_BASE_URL},data:{email:"admin@biblioconnect.com",senha:"admin123"}});
  return createBook({request,adminToken:await sessionCredentials(login),overrides});
}
for (const [action,endpoint,payload] of [
  ["compra","/comprar",livro=>({livroId:livro.id,modalidadeEntrega:"retirada"})],
  ["aluguel","/alugar",livro=>({livroId:livro.id,dias:9})],
  ["reserva","/reservar",livro=>({livroId:livro.id,dataRetirada:"2026-12-01"})],
]) test(`catálogo cria ${action} na API isolada`,async({page,request})=>{
  const livro=await bookFor(request);
  const client=await createConfirmedClient({request});
  await loginUi(page,client); await page.goto("/livros");
  await page.getByLabel("Buscar no acervo").fill(livro.titulo);
  const card=page.getByRole("article").filter({has:page.getByRole("heading",{name:livro.titulo,exact:true})});
  await card.getByRole("button",{name:action==="compra"?"Comprar":action==="aluguel"?"Alugar":"Reservar",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:`Confirmar ${action}`});
  if(action==="aluguel")await dialog.getByLabel("Quantidade de dias").fill("9");
  if(action==="reserva")await dialog.getByLabel("Data de retirada").fill("2026-12-01");
  let sends=0;
  page.on("request",req=>{if(req.method()==="POST" && new URL(req.url()).pathname===endpoint)sends++;});
  const [response]=await Promise.all([
    page.waitForResponse(res=>res.request().method()==="POST" && new URL(res.url()).pathname===endpoint),
    dialog.getByRole("button",{name:`Confirmar ${action}`,exact:true}).click()
  ]);
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON()).toEqual(payload(livro));
  const order=await response.json();
  await expect(page).toHaveURL(new RegExp(`/pedido-confirmado/${order.id}$`));
  expect(sends).toBe(1);
});
test("filtros, avaliações e estoque zero continuam disponíveis",async({page,request})=>{
  const livro=await bookFor(request,{estoque:0});
  await page.goto("/livros"); await page.getByLabel("Buscar no acervo").fill(livro.titulo);
  const card=page.getByRole("article").filter({has:page.getByRole("heading",{name:livro.titulo,exact:true})});
  for(const name of ["Comprar","Alugar","Reservar"])await expect(card.getByRole("button",{name,exact:true})).toBeDisabled();
  await page.getByLabel("Buscar no acervo").fill("não existe neste acervo");
  await expect(page.getByRole("heading",{name:"Nenhum livro encontrado"})).toBeVisible();
  await page.getByRole("button",{name:"Limpar filtros"}).click();
  await page.getByLabel("Buscar no acervo").fill(livro.titulo);
  await card.getByRole("button",{name:"Avaliações",exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`/livros/${livro.id}/avaliacoes$`));
});
