import {sessionCredentials} from "./helpers.js";
import { test, expect } from "@playwright/test";
import { createBook } from "./helpers.js";
import {captureReview} from "./capture-review.js";
let book,other;
const coverUrl=`${process.env.QA_API_URL}/qa-cover.svg`;
const cover='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#1e3a5f"/><path d="M40 80H360M40 520H360" stroke="#e67e00" stroke-width="4"/><text x="45" y="230" fill="#fff7ed" font-family="serif" font-size="40">LEITURA</text><text x="45" y="280" fill="#fff7ed" font-family="serif" font-size="40">DE TESTE</text><text x="45" y="470" fill="#fff7ed" font-size="20">Acervo exclusivo de QA</text></svg>';
test.beforeAll(async({request})=>{
  const login=await request.post(`${process.env.QA_API_URL}/login`,{headers:{Origin:process.env.QA_BASE_URL},data:{email:"admin@biblioconnect.com",senha:"admin123"}});
  const adminToken=await sessionCredentials(login);
  other=await createBook({request,adminToken,overrides:{titulo:`Outra obra em destaque ${Date.now()}`,imagemUrlExterna:coverUrl}});
  book=await createBook({request,adminToken,overrides:{titulo:"Uma leitura real em cena",imagemUrlExterna:coverUrl}});
});
test.beforeEach(async({page})=>{
  await page.route(coverUrl,route=>route.fulfill({contentType:"image/svg+xml",body:cover,headers:{"access-control-allow-origin":"*"}}));
});
test("home editorial em desktop, tablet e celular com fallback leve",async({page},info)=>{
  for(const width of [1440,768,360]){
    const scenes=[];
    page.on("request",req=>{if(/BookScene[-.]/.test(req.url()))scenes.push(req.url());});
    await page.setViewportSize({width,height:1000});await page.goto("/");
    await expect(page.getByRole("heading",{name:book.titulo,exact:true}).first()).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator("[data-hero-detail]").first()).toHaveCSS("opacity","1");
    await expect(page.locator("[data-hero-detail]").last()).toHaveCSS("opacity","1");
    await page.screenshot({path:info.outputPath(`home-editorial-${width}.png`),fullPage:true});
    await captureReview(page,`home-${width}`);
    await captureReview(page,`home-${width}-full`,{fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width<768){await expect(page.locator("canvas")).toHaveCount(0);expect(scenes).toEqual([]);}
  }
});
test("troca manual de destaque funciona por teclado",async({page})=>{
  await page.goto("/");
  await page.getByRole("button",{name:`Ir para ${other.titulo}`}).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region",{name:"Descubra sua próxima leitura"}).getByRole("heading",{name:other.titulo,exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:/Pausar|Retomar/})).toHaveCount(0);
  await page.getByRole("link",{name:"Ver catálogo",exact:true}).click();
  await expect(page).toHaveURL(/\/livros$/);
});
test("movimento reduzido não baixa a cena nem monta Canvas",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  const scenes=[];page.on("request",req=>{if(/BookScene[-.]/.test(req.url()))scenes.push(req.url());});
  await page.goto("/");await expect(page.getByRole("heading",{name:book.titulo,exact:true}).first()).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);expect(scenes).toEqual([]);
  await expect(page.getByRole("link",{name:"Ver catálogo",exact:true})).toBeVisible();
});
test("sem WebGL mantém a capa estática e acesso ao catálogo",async({page})=>{
  await page.addInitScript(()=>{
    window.__qaWebglAttempts=0;const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){
      if(type==="webgl" || type==="webgl2" || type==="experimental-webgl"){window.__qaWebglAttempts++;return null;}
      return getContext.call(this,type,...args);
    };
  });
  await page.goto("/");
  await expect.poll(()=>page.evaluate(()=>window.__qaWebglAttempts),{timeout:10000}).toBeGreaterThan(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("region",{name:"Descubra sua próxima leitura"}).getByRole("img",{name:`Capa de ${book.titulo}`})).toBeVisible();
  await expect(page.getByRole("link",{name:"Ver catálogo",exact:true})).toBeVisible();
});
test("catálogo direto não requisita o módulo 3D",async({page})=>{
  const scenes=[];page.on("request",req=>{if(/BookScene[-.]/.test(req.url()))scenes.push(req.url());});
  await page.goto("/livros");await expect(page.getByRole("heading",{name:"Livros disponíveis"})).toBeVisible();
  expect(scenes).toEqual([]);
});
test("Canvas renderiza o livro e perda de contexto conserva a navegação",async({page},info)=>{
  await page.goto("/");
  const canvas=page.locator("canvas");await expect(canvas).toBeVisible({timeout:10000});
  await expect.poll(()=>canvas.evaluate(el=>el.width>0 && el.height>0)).toBe(true);
  await page.screenshot({path:info.outputPath("home-3d-1440.png")});
  await captureReview(page,"home-3d-1440");
  await canvas.dispatchEvent("webglcontextlost");
  await expect(canvas).toHaveCount(0);
  await expect(page.getByRole("region",{name:"Descubra sua próxima leitura"}).getByRole("img",{name:`Capa de ${book.titulo}`})).toBeVisible();
  await page.getByRole("link",{name:"Ver catálogo",exact:true}).click();await expect(page).toHaveURL(/\/livros$/);
});
test("erro de capa mantém dados reais e navegação",async({page})=>{
  await page.route(coverUrl,route=>route.fulfill({status:404,body:"Capa indisponível"}));
  await page.goto("/");
  const hero=page.getByRole("region",{name:"Descubra sua próxima leitura"});
  await expect(hero.getByRole("heading",{name:book.titulo,exact:true})).toBeVisible();
  await expect(hero.getByText(book.autor,{exact:true}).first()).toBeVisible();
  await expect(page.getByRole("link",{name:"Ver catálogo",exact:true})).toBeVisible();
});
