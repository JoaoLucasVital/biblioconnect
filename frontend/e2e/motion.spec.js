import {test,expect} from "@playwright/test";
import {createBook,createConfirmedClient,sessionCredentials,loginUi} from "./helpers.js";
test("partículas globais, hold verde e nota animada preservam compra e moderação",async({page,request})=>{
  const admin=await request.post(`${process.env.QA_API_URL}/login`,{headers:{Origin:process.env.QA_BASE_URL},data:{email:"admin@biblioconnect.com",senha:"admin123"}}),book=await createBook({request,adminToken:await sessionCredentials(admin)}),client=await createConfirmedClient({request});
  await loginUi(page,client);await page.setViewportSize({width:360,height:900});await page.goto("/livros");await page.getByLabel("Buscar no acervo").fill(book.titulo);
  const card=page.getByRole("article").filter({has:page.getByRole("heading",{name:book.titulo,exact:true})});await card.getByRole("button",{name:"Comprar",exact:true}).click();const dialog=page.getByRole("dialog",{name:"Confirmar compra"});await expect(dialog).toBeVisible();
  const confirm=dialog.getByRole("button",{name:"Confirmar compra",exact:true});await confirm.click();await expect(page.locator(".bc-click-spark")).toHaveCount(8);expect(await page.locator(".bc-click-sparks").evaluate(node=>node.matches(":popover-open"))).toBe(true);
  await expect(confirm).toHaveAttribute("data-state","idle");
  let release;const gate=new Promise(resolve=>{release=resolve;});await page.route("**/comprar",async route=>{await gate;await route.continue();});
  const held=confirm.press("Space",{delay:1300});await expect(confirm).toHaveAttribute("data-state","done");await expect(confirm).toHaveCSS("background-color","rgb(22, 112, 70)");await held;release();await expect(page).toHaveURL(/\/pedido-confirmado\/\d+$/);
  await page.goto(`/livros/${book.id}/avaliacoes`);await page.getByRole("radio",{name:/^4 estrelas/}).check();await page.getByLabel("Comentário",{exact:true}).fill("Uma leitura com avaliação real e revisão da biblioteca.");
  expect(await page.getByLabel("Comentário",{exact:true}).inputValue()).toBe("Uma leitura com avaliação real e revisão da biblioteca.");
  const [review]=await Promise.all([page.waitForResponse(response=>response.request().method()==="POST"&&new URL(response.url()).pathname.endsWith("/avaliacoes")),page.getByRole("button",{name:"Enviar para moderação"}).click()]);expect(review.status()).toBe(201);expect((await review.json()).avaliacao.nota).toBe(4);await expect(page.getByRole("status")).toContainText("aprovação");expect((await (await request.get(`${process.env.QA_API_URL}/livros/${book.id}/avaliacoes`)).json()).total).toBe(0);
  await page.emulateMedia({reducedMotion:"reduce"});await expect(page.locator(".bc-click-spark")).toHaveCount(0);await page.getByRole("link",{name:"Voltar ao catálogo"}).click();await expect(page.locator(".bc-click-spark")).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
