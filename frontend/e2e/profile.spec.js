import sharp from "sharp";
import {test,expect} from "@playwright/test";
import {createConfirmedClient,loginUi,authHeaders} from "./helpers.js";
import {captureReview} from "./capture-review.js";
test("perfil edita dados, mantém cartão e cabe no celular com movimento reduzido",async({page,request})=>{
  const client=await createConfirmedClient({request});await loginUi(page,client);await page.goto("/perfil");
  await page.getByLabel("Nome completo",{exact:true}).fill("Uma leitora com nome completo e sobrenome extenso");await page.getByRole("button",{name:"Salvar alterações"}).click();await expect(page.getByRole("status")).toContainText("Perfil atualizado");
  await page.reload();await expect(page.getByLabel("Nome completo",{exact:true})).toHaveValue("Uma leitora com nome completo e sobrenome extenso");
  await captureReview(page,"perfil-1440");await page.emulateMedia({reducedMotion:"reduce"});await page.setViewportSize({width:360,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await captureReview(page,"perfil-360");
  await page.getByRole("button",{name:"Importar foto"}).click();await expect(page.getByRole("dialog",{name:"Sua foto no cartão"})).toBeVisible();await page.getByRole("button",{name:"Cancelar",exact:true}).click();await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("foto inteira mantém fundo, proporção e bordas após salvar e recarregar",async({page,request})=>{
  const client=await createConfirmedClient({request});await loginUi(page,client);await page.goto("/perfil");
  const external=[],models=[];page.on("request",req=>{const url=new URL(req.url());if(url.origin!==process.env.QA_API_URL&&url.origin!==process.env.QA_BASE_URL)external.push(req.url());if(url.pathname.includes("/models/"))models.push(req.url());});
  // Deliberately no face: both differently colored edges must survive intact.
  const pixels=Buffer.alloc(800*400*3);
  for(let y=0;y<400;y++)for(let x=0;x<800;x++){const i=(y*800+x)*3;const color=x<400?[20,50,180]:[230,120,30];pixels.set(color,i);}
  const input=await sharp(pixels,{raw:{width:800,height:400,channels:3}}).png().toBuffer();
  await page.getByRole("button",{name:"Importar foto"}).click();await page.getByLabel("Escolher foto").setInputFiles({name:"complete-photo.png",mimeType:"image/png",buffer:input});
  await expect(page.getByAltText("Prévia da foto completa com fundo original")).toBeVisible();
  const previewRatio=await page.locator(".bc-photo-preview").evaluate(element=>{const style=getComputedStyle(element);return (element.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight))/(element.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom));});
  expect(previewRatio).toBeCloseTo(2,1);
  await expect(page.getByRole("alert")).toHaveCount(0);await expect(page.getByLabel("Zoom",{exact:true})).toHaveCount(0);
  const [upload]=await Promise.all([page.waitForResponse(res=>new URL(res.url()).pathname==="/me/foto"&&res.request().method()==="POST"),page.getByRole("button",{name:"Salvar foto",exact:true}).click()]);expect(upload.status()).toBe(200);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const photo=await request.get(`${process.env.QA_API_URL}/me/foto`,{headers:authHeaders(client.token)});expect(photo.status()).toBe(200);
  const bytes=await photo.body(),metadata=await sharp(bytes).metadata();expect(metadata.format).toBe("webp");expect(metadata.width/metadata.height).toBe(2);expect(metadata.exif).toBeUndefined();expect(bytes.length).toBeLessThan(2*1024*1024);
  const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(const [x,y,color] of [[0,0,[20,50,180]],[info.width-1,info.height-1,[230,120,30]]]){const i=(y*info.width+x)*4;expect(data[i+3]).toBe(255);for(let c=0;c<3;c++)expect(Math.abs(data[i+c]-color[c])).toBeLessThan(15);}
  await page.reload();await expect(page.getByAltText("Leitor QA",{exact:true})).toBeVisible();
  const card=page.locator(".profile-card__photo");await expect(card).toHaveCSS("object-fit","contain");await expect(card).toHaveCSS("transform","none");
  const tileRatio=await page.locator(".profile-card__tile").evaluate(element=>element.clientWidth/element.clientHeight);expect(tileRatio).toBeCloseTo(2,1);
  await captureReview(page,"perfil-foto-completa");
  const portrait=await sharp({create:{width:450,height:600,channels:3,background:"#1e3a5f"}}).png().toBuffer();
  await page.getByRole("button",{name:"Importar foto"}).click();await page.getByLabel("Escolher foto").setInputFiles({name:"portrait.png",mimeType:"image/png",buffer:portrait});
  await expect(page.getByAltText("Prévia da foto completa com fundo original")).toBeVisible();
  expect(await page.locator(".bc-photo-preview").evaluate(element=>element.clientWidth/element.clientHeight)).toBeCloseTo(.75,1);
  await page.getByRole("button",{name:"Cancelar",exact:true}).click();
  const unchanged=await request.get(`${process.env.QA_API_URL}/me/foto`,{headers:authHeaders(client.token)});expect(await unchanged.body()).toEqual(bytes);expect(external).toEqual([]);expect(models).toEqual([]);
});
