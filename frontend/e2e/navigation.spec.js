import { test, expect } from "@playwright/test";
import { createConfirmedClient, loginUi } from "./helpers.js";

test("navegação pública móvel, teclado e ausência de transbordamento", async ({page}) => {
  await page.setViewportSize({width:360,height:800});
  await page.goto("/");
  const trigger = page.getByRole("button",{name:"Abrir navegação"});
  await trigger.click();
  const dialog = page.getByRole("dialog",{name:"Navegação"});
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded","true");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link",{name:"Catálogo",exact:true}).click();
  await expect(page).toHaveURL(/\/livros$/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("cliente por URL direta não recebe administração", async ({page,request}) => {
  const client = await createConfirmedClient({request});
  await loginUi(page,client);
  await page.goto("/admin");
  await expect(page.getByRole("heading",{name:"Acesso negado"})).toBeVisible();
  await expect(page.getByRole("navigation",{name:"Administração"})).toHaveCount(0);
});
test("admin navega pelo menu móvel e sai da conta", async ({page}) => {
  await page.setViewportSize({width:360,height:800});
  await loginUi(page,{email:"admin@biblioconnect.com",senha:"admin123"});
  await page.goto("/admin");
  await page.getByRole("button",{name:"Menu administrativo"}).click();
  const dialog = page.getByRole("dialog",{name:"Administração",exact:true});
  await dialog.getByRole("link",{name:"Financeiro",exact:true}).click();
  await expect(page).toHaveURL(/\/admin\/financeiro$/);
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button",{name:"Abrir navegação"}).click();
  await page.getByRole("dialog",{name:"Navegação"}).getByRole("button",{name:"Sair"}).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});
