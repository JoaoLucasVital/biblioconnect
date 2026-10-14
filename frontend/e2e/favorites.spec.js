import {test,expect} from "@playwright/test";
import {createBook,createConfirmedClient,sessionCredentials,loginUi} from "./helpers.js";
test("dois leitores veem totais reais, persistência e reconexão nos salvos",async({page,browser,request})=>{
  const admin=await request.post(`${process.env.QA_API_URL}/login`,{headers:{Origin:process.env.QA_BASE_URL},data:{email:"admin@biblioconnect.com",senha:"admin123"}});
  const book=await createBook({request,adminToken:await sessionCredentials(admin)}),one=await createConfirmedClient({request}),two=await createConfirmedClient({request});
  const context=await browser.newContext({baseURL:process.env.QA_BASE_URL}),other=await context.newPage();
  try{
    await loginUi(page,one);await loginUi(other,two);await page.goto("/livros");await other.goto("/livros");
    const card=tab=>tab.getByRole("article").filter({has:tab.getByRole("heading",{name:book.titulo,exact:true})});
    const heart=tab=>card(tab).locator(".bc-pulse-heart");await expect(heart(page)).toBeEnabled();await expect(heart(other)).toBeEnabled();
    await heart(page).click();await expect(heart(page)).toHaveAttribute("aria-pressed","true");await expect(heart(other)).toContainText("1",{timeout:2000});await expect(heart(other)).toHaveAttribute("aria-pressed","false");
    await heart(other).click();await expect(heart(page)).toContainText("2",{timeout:2000});
    await heart(page).click();await expect(heart(other)).toContainText("1",{timeout:2000});await page.reload();await expect(heart(page)).toHaveAttribute("aria-pressed","false");
    await context.setOffline(true);await heart(page).click();await expect(heart(page)).toContainText("2");await context.setOffline(false);await expect(heart(other)).toContainText("2",{timeout:10000});
    await other.goto("/perfil");const saved=other.getByRole("region",{name:"Seus livros salvos"});await expect(saved.getByRole("heading",{name:book.titulo,exact:true})).toBeVisible();
    await saved.locator(".bc-pulse-heart").click();await expect(saved.getByText(/Seu próximo capítulo/)).toBeVisible();await expect(heart(page)).toContainText("1",{timeout:2000});
  }finally{await context.close();}
});
