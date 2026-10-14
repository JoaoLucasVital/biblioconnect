import { test,expect } from "@playwright/test";

test("busca revela a nova letra e preserva valor, cursor e edição no meio",async({page})=>{
  await page.goto("/livros");
  const input=page.getByRole("searchbox",{name:"Buscar no acervo"});
  await input.fill(""); await input.pressSequentially("Dom");
  await expect(input).toHaveValue("Dom");
  await expect(input).toHaveAttribute("data-fading","true");
  expect(await input.evaluate(el=>el.selectionStart)).toBe(3);
  await input.press("Home"); await input.pressSequentially("X");
  await expect(input).toHaveValue("XDom");
  await expect(input).not.toHaveAttribute("data-fading","true");
  await input.press("End"); await input.press("Backspace");
  await expect(input).toHaveValue("XDo");
});

test("reduced-motion mantém entrada nativa e senha nunca recebe a camada visual",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"}); await page.goto("/cadastro");
  const name=page.getByRole("textbox",{name:"Nome completo",exact:true});
  await name.pressSequentially("João");
  await expect(name).toHaveValue("João");
  await expect(name).not.toHaveAttribute("data-fading","true");
  const password=page.getByLabel("Senha",{exact:true}); await password.fill("apenas-teste");
  await expect(password).toHaveAttribute("type","password");
  await expect(password).not.toHaveAttribute("data-fading","true");
});
