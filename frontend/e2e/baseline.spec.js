import { test, expect } from "@playwright/test";
import { createBook, createConfirmedClient, loginUi } from "./helpers.js";

let adminToken;
let livro;
test.beforeAll(async ({ request }) => {
  const response = await request.post(`${process.env.QA_API_URL}/login`,
    { data: { email: "admin@biblioconnect.com", senha: "admin123" } });
  expect(response.ok()).toBe(true);
  adminToken = (await response.json()).token;
  livro = await createBook({ request, adminToken });
});

test("visitante consulta o acervo real e registra a baseline visual", async ({ page }, info) => {
  await page.goto("/livros");
  await expect(page.getByText(livro.titulo, { exact: true }).first()).toBeVisible();
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: /ver catálogo/i }).first()).toBeVisible();
    await page.screenshot({ path: info.outputPath(`home-${width}.png`), fullPage: true });
  }
});

test("cliente confirmado entra e encontra seus pedidos", async ({ page, request }) => {
  const client = await createConfirmedClient({ request });
  await loginUi(page, client);
  await page.goto("/meus-pedidos");
  await expect(page.getByRole("link", { name: /meus pedidos/i }).first()).toBeVisible();
  await expect(page.getByText("Leitor QA", { exact: true }).first()).toBeVisible();
});

test("administrador entra e acessa o acervo administrativo", async ({ page }) => {
  await loginUi(page, { email: "admin@biblioconnect.com", senha: "admin123" });
  await page.goto("/admin/livros");
  await expect(page.getByText(livro.titulo, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /novo livro/i }).first()).toBeVisible();
});

test("alternância de tema existente continua lembrada ao recarregar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /escuro/i }).click();
  await expect(page.locator("body")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("body")).toHaveClass(/dark/);
  await page.getByRole("button", { name: /claro/i }).click();
  await expect(page.locator("body")).not.toHaveClass(/dark/);
});
