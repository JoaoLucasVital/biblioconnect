import {sessionCredentials} from "./helpers.js";
import {test,expect} from "@playwright/test";
import {createBook,createConfirmedClient,loginUi} from "./helpers.js";
test("diálogo contém foco, fecha com Escape e suporta título extenso a 360px",async({page,request},info)=>{
  const admin=await request.post(`${process.env.QA_API_URL}/login`,{headers:{Origin:process.env.QA_BASE_URL},data:{email:"admin@biblioconnect.com",senha:"admin123"}});
  const livro=await createBook({request,adminToken:await sessionCredentials(admin),overrides:{titulo:"Uma história de encontros, memórias e descobertas que continua muito além das margens de uma página",imagemUrl:null}});
  const client=await createConfirmedClient({request});
  await loginUi(page,client); await page.setViewportSize({width:360,height:800});await page.goto("/livros");
  await page.getByLabel("Buscar no acervo").fill(livro.titulo);
  const trigger=page.getByRole("article").getByRole("button",{name:"Comprar",exact:true});
  await trigger.click(); const dialog=page.getByRole("dialog",{name:"Confirmar compra"});
  await expect(dialog).toBeVisible();
  for(const key of ["Tab","Tab","Tab","Tab","Tab","Tab","Shift+Tab","Shift+Tab"]){
    await page.keyboard.press(key);
    const focus=await dialog.evaluate(el=>({inside:el.contains(document.activeElement),tag:document.activeElement?.tagName,text:document.activeElement?.textContent?.slice(0,70)}));
    expect(focus.inside, `${key}: foco em ${focus.tag} ${focus.text}`).toBe(true);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await dialog.getByRole("button",{name:"Confirmar compra",exact:true}).scrollIntoViewIfNeeded();
  await expect(dialog.getByRole("button",{name:"Confirmar compra",exact:true})).toBeInViewport();
  await page.screenshot({path:info.outputPath("compra-360.png")});
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
  await page.screenshot({path:info.outputPath("catalogo-360.png"),fullPage:true});
});
