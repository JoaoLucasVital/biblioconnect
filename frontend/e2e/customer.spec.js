import fs from "node:fs/promises";
import path from "node:path";
import {test,expect} from "@playwright/test";
import {createBook,createConfirmedClient,loginUi} from "./helpers.js";
async function setup(request){
  const login=await request.post(`${process.env.QA_API_URL}/login`,{data:{email:"admin@biblioconnect.com",senha:"admin123"}});
  const book=await createBook({request,adminToken:(await login.json()).token,overrides:{estoque:10}});
  const client=await createConfirmedClient({request});
  return {book,client};
}
async function orderFor(request,book,client){
  const response=await request.post(`${process.env.QA_API_URL}/comprar`,{headers:{Authorization:`Bearer ${client.token}`},data:{livroId:book.id,modalidadeEntrega:"retirada"}});
  expect(response.ok()).toBe(true);return response.json();
}
test("cliente acompanha pagamento demonstrativo, comprovante, avaliação e atendimento",async({page,request},info)=>{
  const {book,client}=await setup(request);const order=await orderFor(request,book,client);
  await loginUi(page,client);await page.goto(`/pedido-confirmado/${order.id}`);
  await expect(page.getByText("Pagamento pendente",{exact:true}).first()).toBeVisible();
  await page.getByRole("button",{name:"Simular pagamento (demonstração)"}).click();
  await expect(page.getByText("Pagamento aprovado",{exact:true}).first()).toBeVisible();
  await page.getByRole("link",{name:"Ver comprovante",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Comprovante do pedido"})).toBeVisible();
  await expect(page.getByText(book.titulo,{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath("comprovante-1440.png"),fullPage:true});
  await page.goto(`/livros/${book.id}/avaliacoes`);
  await page.getByLabel("Comentário",{exact:true}).fill("Uma leitura muito interessante para nossa biblioteca.");
  await page.getByRole("button",{name:"Enviar para moderação"}).click();
  await expect(page.getByRole("status")).toContainText("após a aprovação");
  await page.goto("/chat");await page.getByLabel("Mensagem para a biblioteca").fill("Gostaria de confirmar a retirada do meu pedido.");
  await page.getByRole("button",{name:"Enviar",exact:true}).click();
  await expect(page.getByText("Gostaria de confirmar a retirada do meu pedido.",{exact:true})).toBeVisible();
  await page.setViewportSize({width:360,height:800});await page.screenshot({path:info.outputPath("atendimento-360.png")});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test("cancelamento permitido atualiza os pedidos reais",async({page,request})=>{
  const {book,client}=await setup(request);await orderFor(request,book,client);
  await loginUi(page,client);await page.goto("/meus-pedidos");
  await page.getByRole("button",{name:"Cancelar pedido",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Cancelar pedido",exact:true});
  await dialog.getByRole("button",{name:"Confirmar cancelamento"}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Cancelado",{exact:true}).first()).toBeVisible();
});
test("recuperação por email local redefine a senha existente",async({page,request})=>{
  const client=await createConfirmedClient({request});
  const before=new Set(await fs.readdir(process.env.EMAIL_OUTPUT_DIR));
  await page.goto("/esqueci-senha");await page.getByLabel("Email cadastrado").fill(client.email);
  await page.getByRole("button",{name:"Enviar link de redefinição"}).click();
  await expect(page.getByRole("status")).toBeVisible();
  let reset;
  await expect.poll(async()=>{
    for(const name of await fs.readdir(process.env.EMAIL_OUTPUT_DIR)){
      if(before.has(name))continue;
      const html=await fs.readFile(path.join(process.env.EMAIL_OUTPUT_DIR,name),"utf8");
      const link=html.match(/https?:[^"\s<>]*\/redefinir-senha\/[a-f0-9]+/)?.[0];
      if(link && new URL(link).origin===process.env.QA_BASE_URL){reset=link;return true;}
    }return false;
  }).toBe(true);
  await page.goto(reset);await page.getByLabel("Nova senha",{exact:true}).fill("NovaSenhaQA456!");
  await page.getByLabel("Confirmar nova senha",{exact:true}).fill("NovaSenhaQA456!");
  await page.getByRole("button",{name:"Redefinir senha",exact:true}).click();
  await expect(page).toHaveURL(/\/login$/);
  await loginUi(page,{email:client.email,senha:"NovaSenhaQA456!"});
});
test("pedido inexistente e pedido de outro leitor conservam o bloqueio do servidor",async({page,request})=>{
  const {book,client}=await setup(request);const order=await orderFor(request,book,client);
  const another=await createConfirmedClient({request});await loginUi(page,another);
  await page.goto(`/pedido-confirmado/${order.id}`);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button",{name:/Pagar com/})).toHaveCount(0);
  await page.goto("/pedido-confirmado/99999999");
  await expect(page.getByRole("alert")).toBeVisible();
});
test("cadastro pela interface mantém os dados enviados ao servidor",async({page},info)=>{
  await page.route("https://viacep.com.br/**",route=>route.fulfill({json:{logradouro:"Rua de teste",bairro:"Centro",localidade:"Maceió",uf:"AL"}}));
  await page.goto("/cadastro");
  const email=`cadastro-${Date.now()}@example.test`;
  for(const [label,value] of [["Nome completo","Leitor cadastrado pela interface"],["Email",email],["Senha","SenhaCadastro123!"],["Confirmar senha","SenhaCadastro123!"],["CEP","57000000"]]){
    await page.getByLabel(label,{exact:true}).fill(value);
  }
  await page.getByLabel("Número",{exact:true}).fill("12");
  await expect(page.getByLabel("Rua / Avenida",{exact:true})).toHaveValue("Rua de teste");
  await page.screenshot({path:info.outputPath("cadastro-1440.png"),fullPage:true});
  const [response]=await Promise.all([page.waitForResponse(res=>res.request().method()==="POST"&&new URL(res.url()).pathname==="/usuarios"),page.getByRole("button",{name:"Criar conta",exact:true}).click()]);
  expect(response.status()).toBe(201);
  expect(response.request().postDataJSON()).toMatchObject({email,nome:"Leitor cadastrado pela interface",rua:"Rua de teste",numero:"12"});
  await expect(page).toHaveURL(/\/login$/);
});
test("rede lenta não duplica mensagem e falha preserva rascunho",async({page,request})=>{
  const client=await createConfirmedClient({request});await loginUi(page,client);await page.goto("/chat");
  let release;const wait=new Promise(resolve=>{release=resolve;});let sends=0;
  await page.route("**/chat/mensagens",async route=>{sends++;await wait;await route.fulfill({status:503,json:{erro:"Envio temporariamente indisponível"}});});
  await page.getByLabel("Mensagem para a biblioteca").fill("Minha mensagem precisa continuar aqui.");
  await page.getByRole("button",{name:"Enviar",exact:true}).click();
  await expect(page.getByRole("button",{name:"Enviando..."})).toBeDisabled();
  expect(sends).toBe(1);release();
  await expect(page.getByRole("alert")).toContainText("Envio temporariamente indisponível");
  await expect(page.getByLabel("Mensagem para a biblioteca")).toHaveValue("Minha mensagem precisa continuar aqui.");
});
