import {sessionCredentials,authHeaders} from "./helpers.js";
import fs from "node:fs/promises";
import path from "node:path";
import {test,expect} from "@playwright/test";
import {createBook,createConfirmedClient,loginUi} from "./helpers.js";
import {captureReview} from "./capture-review.js";
const credentials={email:"admin@biblioconnect.com",senha:"admin123"};
test("catálogo tenta novamente após HTTP 500",async({page})=>{
  await page.route(`${process.env.QA_API_URL}/livros`,route=>route.fulfill({status:500,json:{erro:"Falha controlada"}}));
  await page.goto("/livros");await expect(page.getByRole("alert")).toContainText("Erro ao carregar catálogo");
  const retry=page.getByRole("button",{name:"Tentar novamente"});await page.unroute(`${process.env.QA_API_URL}/livros`);await retry.click();
  await expect(retry).toHaveCount(0);await expect(page.getByRole("heading",{name:"Livros disponíveis"})).toBeVisible();
});
test("lista vazia conserva descoberta e ações",async({page})=>{
  await page.route(`${process.env.QA_API_URL}/livros`,route=>route.fulfill({json:[]}));
  await page.goto("/");await expect(page.getByText("Nenhum livro disponível ainda")).toBeVisible();
  await page.getByRole("link",{name:"Explorar leituras",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Nenhum livro encontrado"})).toBeVisible();
});
test("casos extremos usam os mesmos componentes sem transbordar",async({page},info)=>{
  const original={id:40001,titulo:"Uma leitura para descobrir",autor:"Jo",redator:"Editora",ano:2025,categoria:"Romance",sinopse:"Um livro de teste para o acervo.",estoque:1,precoCompra:20,precoAluguel:5,diasInclusos:7,precoDiaExtra:2,disponivel:true,imagemUrl:null};
  const worst=[{...original,titulo:"Uma história de encontros, memórias e descobertas que continua muito além das margens de uma página",autor:"Aleksandra Wiśniewska-Kowalczyk",estoque:12345,precoCompra:98765.43},
    {...original,id:40002,titulo:"Memórias de uma biblioteca",autor:"王秀英",estoque:0,imagemUrl:`${process.env.QA_API_URL}/capa-inexistente.jpg`},
    {...original,id:40003,titulo:"Histórias",autor:"J",isDoado:true,sinopse:"",categoria:"Literatura brasileira"}];
  let selection="Padrão";
  await page.route(`${process.env.QA_API_URL}/livros`,route=>route.fulfill({json:selection==="Extremos"?worst:selection==="Vazio"?[]:[original]}));
  await page.addInitScript(()=>{
    document.addEventListener("DOMContentLoaded",()=>{
      const select=document.createElement("select");select.id="qa-data";select.setAttribute("aria-label","Dados de teste");
      select.style.cssText="position:fixed;bottom:10px;right:10px;z-index:9999;background:white;color:#111;padding:8px;border:1px solid #777";
      for(const name of ["Padrão","Extremos","Vazio"]){const option=document.createElement("option");option.value=name;option.textContent=name;select.append(option);}
      select.value=localStorage.getItem("qaData") || "Padrão";
      select.addEventListener("change",()=>localStorage.setItem("qaData",select.value));
      document.body.append(select);
    });
  });
  await page.setViewportSize({width:320,height:800});await page.goto("/livros");
  await page.getByLabel("Dados de teste").selectOption("Extremos");selection="Extremos";await page.reload();
  await expect(page.getByRole("heading",{name:worst[0].titulo,exact:true})).toBeVisible();
  const overflow=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll("body *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1 && getComputedStyle(el).position!=="fixed").slice(0,8).map(el=>({tag:el.tagName,class:el.className,right:Math.round(el.getBoundingClientRect().right)}))}));
  expect(overflow.scrollWidth<=overflow.width,JSON.stringify(overflow)).toBe(true);
  await page.getByRole("switch",{name:"Tema escuro",exact:true}).check();
  await expect(page.locator("body")).toHaveClass(/dark/);
  await page.screenshot({path:info.outputPath("extremos-320-escuro.png"),fullPage:true});
  await captureReview(page,"extremos-320-escuro");
  await page.getByLabel("Dados de teste").selectOption("Vazio");selection="Vazio";await page.reload();
  await expect(page.getByRole("heading",{name:"Nenhum livro encontrado"})).toBeVisible();
});
test("texto a 200% mantém ações e formulário alcançáveis",async({page})=>{
  await page.setViewportSize({width:768,height:1000});await page.goto("/login");
  await page.addStyleTag({content:"html{font-size:200%}"});
  await expect(page.getByLabel("Email",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Entrar",exact:true}).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button",{name:"Entrar",exact:true})).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test("comprovante impresso oculta navegação e conserva os dados",async({page,request},info)=>{
  const admin=await request.post(`${process.env.QA_API_URL}/login`,{headers:{Origin:process.env.QA_BASE_URL},data:credentials});
  const book=await createBook({request,adminToken:await sessionCredentials(admin)});
  const client=await createConfirmedClient({request});
  const purchase=await request.post(`${process.env.QA_API_URL}/comprar`,{headers:authHeaders(client.token),data:{livroId:book.id}});
  const order=await purchase.json();await loginUi(page,client);await page.goto(`/comprovante/${order.id}`);
  await expect(page.getByText(book.titulo,{exact:true})).toBeVisible();
  await page.emulateMedia({media:"print"});
  await expect(page.getByRole("banner")).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Imprimir / Salvar PDF"})).not.toBeVisible();
  await expect(page.getByText(book.titulo,{exact:true})).toBeVisible();
  await page.pdf({path:info.outputPath("comprovante.pdf"),format:"A4",printBackground:true});
  await page.screenshot({path:info.outputPath("comprovante-print.png"),fullPage:true});
  await captureReview(page,"comprovante-print",{fullPage:true});
});
test("medição reproduzível de catálogo e filtro em Chromium",async({page},info)=>{
  await page.goto("/livros");
  await expect(page.getByRole("heading",{name:"Livros disponíveis"})).toBeVisible();
  const navigation=await page.evaluate(()=>{
    const n=performance.getEntriesByType("navigation")[0];
    return {domContentLoadedMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd,transferBytes:performance.getEntriesByType("resource").reduce((sum,r)=>sum+r.transferSize,0),requests:performance.getEntriesByType("resource").length};
  });
  const start=performance.now();await page.getByLabel("Buscar no acervo").fill("nenhuma leitura com este nome");
  await expect(page.getByRole("heading",{name:"Nenhum livro encontrado"})).toBeVisible();
  const report={mode:process.env.QA_PRODUCTION==="1"?"production-preview":"vite-development",viewport:page.viewportSize(),navigation,filterRoundTripMs:Number((performance.now()-start).toFixed(2)),note:"Sem throttling; tempo do filtro inclui automação Playwright."};
  await fs.writeFile(info.outputPath("metrics.json"),JSON.stringify(report,null,2));
  await info.attach("metrics",{body:JSON.stringify(report),contentType:"application/json"});
  const destination=path.resolve("../docs/verification/editorial-metrics.json");
  await fs.writeFile(destination,JSON.stringify(report,null,2));
});
