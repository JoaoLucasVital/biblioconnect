import {test,expect} from "@playwright/test";
import {loginUi,createBook} from "./helpers.js";
import {captureReview} from "./capture-review.js";
test("capturas finais de conta catálogo e administração nos dois temas",async({page,request})=>{
  const response=await request.post(`${process.env.QA_API_URL}/login`,{data:{email:"admin@biblioconnect.com",senha:"admin123"}});
  await createBook({request,adminToken:(await response.json()).token,overrides:{titulo:"Uma história de encontros, memórias e descobertas além das margens da página",autor:"Aleksandra Wiśniewska-Kowalczyk"}});
  for(const width of [1440,360]){
    await page.setViewportSize({width,height:1000});await page.goto("/livros");await expect(page.getByRole("heading",{name:"Livros disponíveis"})).toBeVisible();
    await captureReview(page,`catalogo-${width}`);
    await page.goto("/login");await expect(page.getByRole("button",{name:"Entrar",exact:true})).toBeVisible();
    if(process.env.QA_PRODUCTION==="1")await expect(page.getByText("Acesso administrativo de teste",{exact:true})).toHaveCount(0);
    await captureReview(page,`login-${width}`);
  }
  await page.setViewportSize({width:1440,height:1000});await loginUi(page,{email:"admin@biblioconnect.com",senha:"admin123"});
  await page.goto("/admin");await expect(page.getByText("Carregando painel administrativo...")).toHaveCount(0);
  await captureReview(page,"admin-1440");await captureReview(page,"admin-1440-full",{fullPage:true});
  await page.getByRole("button",{name:"Escuro",exact:true}).click();await expect(page.locator("body")).toHaveClass(/dark/);
  await captureReview(page,"admin-1440-escuro");
  await page.goto("/admin/financeiro");await expect(page.getByRole("heading",{level:1})).toBeVisible();await captureReview(page,"financeiro-1440-escuro");
  await page.setViewportSize({width:360,height:1000});await page.goto("/admin");
  await expect(page.getByText("Carregando painel administrativo...")).toHaveCount(0);await captureReview(page,"admin-360-escuro");
});
