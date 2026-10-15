import {sessionCredentials} from "./helpers.js";
import { test, expect } from "@playwright/test";
import { createConfirmedClient, createBook, loginUi, holdToConfirm } from "./helpers.js";
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
  let dialog=page.getByRole("dialog",{name:action==="compra"?"Sua próxima leitura":`Confirmar ${action}`});
  if(action==="compra"){await dialog.getByRole("button",{name:"Continuar para checkout"}).click();await expect(page).toHaveURL(new RegExp(`/checkout/${livro.id}$`));dialog=page.getByRole("main");}
  if(action==="aluguel")await dialog.getByLabel("Quantidade de dias").fill("9");
  if(action==="reserva")await dialog.getByLabel("Data de retirada").fill("2026-12-01");
  let sends=0;
  page.on("request",req=>{if(req.method()==="POST" && new URL(req.url()).pathname===endpoint)sends++;});
  const [response]=await Promise.all([
    page.waitForResponse(res=>res.request().method()==="POST" && new URL(res.url()).pathname===endpoint),
    action==="compra"?holdToConfirm(dialog.getByRole("button",{name:`Confirmar ${action}`,exact:true})):dialog.getByRole("button",{name:`Confirmar ${action}`,exact:true}).click()
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
test("entrega indisponível mantém endereço e permite mudar para retirada",async({page,request})=>{
  const livro=await bookFor(request),client=await createConfirmedClient({request});
  await loginUi(page,client);await page.goto("/livros");await page.getByLabel("Buscar no acervo").fill(livro.titulo);
  await page.getByRole("article").filter({has:page.getByRole("heading",{name:livro.titulo,exact:true})}).getByRole("button",{name:"Comprar",exact:true}).click();
  await page.getByRole("dialog",{name:"Sua próxima leitura"}).getByRole("button",{name:"Continuar para checkout"}).click();
  await page.route("https://viacep.com.br/ws/57051565/json/",route=>route.fulfill({json:{logradouro:"Rua José de Alencar",bairro:"Farol",localidade:"Maceió",uf:"AL"}}));
  const dialog=page.getByRole("main");await dialog.getByRole("radio",{name:/Receber em casa/}).check();
  await dialog.getByLabel("CEP",{exact:true}).fill("57051565");await expect(dialog.getByLabel("Rua / Avenida",{exact:true})).toHaveValue("Rua José de Alencar");
  const address=dialog.getByLabel("Número",{exact:true});await address.fill("511");
  await dialog.getByRole("button",{name:"Calcular frete"}).click();
  await expect(dialog.getByRole("alert")).toContainText("temporariamente indisponível");
  await expect(address).toHaveValue("511");
  await expect(dialog.getByRole("button",{name:"Confirmar compra",exact:true})).toBeDisabled();
  await dialog.getByRole("radio",{name:/Buscar na biblioteca/}).check();
  const [response]=await Promise.all([page.waitForResponse(res=>new URL(res.url()).pathname==="/comprar"&&res.request().method()==="POST"),holdToConfirm(dialog.getByRole("button",{name:"Confirmar compra",exact:true}))]);
  expect(response.ok()).toBe(true);expect((await response.json()).valorEntrega).toBe(0);
});
