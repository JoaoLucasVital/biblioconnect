import fs from "node:fs";
import path from "node:path";
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
test("worker real remove fundo, preserva transparência e salva somente resultado privado",async({page,request})=>{
  const fixture=path.resolve("../.superpowers/portrait-fixture.jpg");test.skip(!fs.existsSync(fixture),"Requer a imagem pública de QA MediaPipe, fora dos artefatos publicados.");test.setTimeout(120000);
  const client=await createConfirmedClient({request});await loginUi(page,client);await page.goto("/perfil");
  const external=[];page.on("request",req=>{if(new URL(req.url()).origin!==process.env.QA_API_URL&&new URL(req.url()).origin!==process.env.QA_BASE_URL)external.push(req.url());});
  page.on("console",message=>{if(message.text().startsWith("Portrait runtime:"))console.log(message.text());});
  await page.getByRole("button",{name:"Importar foto"}).click();await page.getByLabel("Escolher foto").setInputFiles(fixture);
  await expect(page.locator(".bc-photo-preview, [role=alert]")).toBeVisible({timeout:90000});await expect(page.getByRole("alert")).toHaveCount(0);expect(external).toEqual([]);
  await page.getByLabel("Zoom",{exact:true}).fill("1.2");
  const [upload]=await Promise.all([page.waitForResponse(res=>new URL(res.url()).pathname==="/me/foto"&&res.request().method()==="POST"),page.getByRole("button",{name:"Salvar foto",exact:true}).click()]);expect(upload.status()).toBe(200);
  await expect(page.getByRole("dialog")).toHaveCount(0);const photo=await request.get(`${process.env.QA_API_URL}/me/foto`,{headers:authHeaders(client.token)});expect(photo.status()).toBe(200);
  const bytes=await photo.body(),metadata=await sharp(bytes).metadata();expect(metadata.format).toBe("webp");expect(metadata.hasAlpha).toBe(true);expect(metadata.exif).toBeUndefined();expect(bytes.length).toBeLessThan(2*1024*1024);
  const raw=await sharp(bytes).ensureAlpha().raw().toBuffer();let transparent=0,opaque=0;for(let i=3;i<raw.length;i+=4){if(raw[i]<20)transparent++;if(raw[i]>220)opaque++;}expect(transparent).toBeGreaterThan(1000);expect(opaque).toBeGreaterThan(1000);
  await page.reload();await expect(page.getByAltText("Leitor QA",{exact:true})).toBeVisible();
  // Same public fixture under different light, with CPU throttling for the
  // second pass. No personal portrait is written into review screenshots.
  const cdp=await page.context().newCDPSession(page);
  for(const [index,brightness] of [.7,1.15].entries()){
    if(index===1){await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});await page.setViewportSize({width:360,height:900});}
    const adjusted=await sharp(fixture).modulate({brightness}).jpeg().toBuffer();
    await page.getByRole("button",{name:"Importar foto"}).click();await page.getByLabel("Escolher foto").setInputFiles({name:"lighting-test.jpg",mimeType:"image/jpeg",buffer:adjusted});
    await expect(page.locator(".bc-photo-preview, [role=alert]")).toBeVisible({timeout:90000});await expect(page.getByRole("alert")).toHaveCount(0);
    await page.getByRole("button",{name:"Cancelar",exact:true}).click();
  }
  await cdp.send("Emulation.setCPUThrottlingRate",{rate:1});await cdp.detach();
  const noFace=await sharp({create:{width:400,height:500,channels:3,background:"#f7f3eb"}}).png().toBuffer();
  await page.getByRole("button",{name:"Importar foto"}).click();await page.getByLabel("Escolher foto").setInputFiles({name:"no-face.png",mimeType:"image/png",buffer:noFace});
  await expect(page.getByRole("alert")).toContainText("rosto",{timeout:90000});await page.getByRole("button",{name:"Cancelar",exact:true}).click();
  const unchanged=await request.get(`${process.env.QA_API_URL}/me/foto`,{headers:authHeaders(client.token)});expect(await unchanged.body()).toEqual(bytes);expect(external).toEqual([]);
});
