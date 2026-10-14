import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { expect } from "@playwright/test";

export async function loginUi(page, { email, senha }) {
  await page.goto("/login");
  await page.getByLabel("Email", {exact:true}).fill(email);
  await page.getByLabel("Senha", {exact:true}).fill(senha);
  await page.getByRole("button", { name: /^entrar$/i }).click();
  await page.waitForURL(url => url.pathname !== "/login");
}

export async function createConfirmedClient({ request, emailDir = process.env.EMAIL_OUTPUT_DIR }) {
  const before = new Set(await fs.readdir(emailDir));
  const email = `leitor-${crypto.randomUUID()}@example.test`;
  const senha = "TesteLocal123!";
  const response = await request.post(`${process.env.QA_API_URL}/usuarios`, { data: {
    nome: "Leitor QA", email, senha, cep: "57000000", rua: "Rua de teste", bairro: "Centro",
    cidade: "Maceió", estado: "AL", numero: "10",
  } });
  expect(response.status()).toBe(201);
  let link;
  const deadline = Date.now() + 5000;
  while (!link && Date.now() < deadline) {
    for (const name of await fs.readdir(emailDir)) {
      if (before.has(name)) continue;
      const html = await fs.readFile(path.join(emailDir, name), "utf8");
      link = html.match(/https?:[^"\s<>]*\/confirmar-email\/[a-f0-9]+/)?.[0];
      if (link) break;
    }
    if (!link) await new Promise(resolve => setTimeout(resolve, 50));
  }
  if (!link || new URL(link).origin !== process.env.QA_API_URL) throw new Error("Confirmação QA não encontrada no e-mail local.");
  expect((await request.get(link)).status()).toBe(200);
  const login = await request.post(`${process.env.QA_API_URL}/login`, { data: { email, senha } });
  expect(login.ok()).toBe(true);
  const { token, usuario } = await login.json();
  return { token, usuario, email, senha };
}

export async function createBook({ request, adminToken, overrides = {} }) {
  const response = await request.post(`${process.env.QA_API_URL}/livros`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { titulo: `Livro QA ${crypto.randomUUID().slice(0, 8)}`, autor: "Autora QA", redator: "Editora QA",
      ano: 2025, categoria: "Romance", sinopse: "Obra utilizada somente no banco isolado de QA.",
      precoCompra: 20, precoAluguel: 5, diasInclusos: 7, precoDiaExtra: 2, estoque: 2, destaque: true,
      ...overrides },
  });
  expect(response.status()).toBe(201);
  return response.json();
}
