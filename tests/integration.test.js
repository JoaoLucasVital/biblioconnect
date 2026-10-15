import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {createQaClient} from "./helpers/qaClient.js";

// Execute somente contra uma instância local criada para testes, com EMAIL_PROVIDER=file.
test("fluxos integrados de autenticação, acervo, pedidos, moderação e chat", { skip: !process.env.API_TEST_URL }, async () => {
  const base = process.env.API_TEST_URL;
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
  let verificacoes = 0;
  const anonymous=createQaClient(base);
  async function api(rota, { method = "GET", body, token, status = 200 } = {}) {
    const dados=await (token||anonymous).request(rota,{method,body,status});
    verificacoes++;return dados;
  }
  const email = `teste-${Date.now()}@example.test`;
  const senha = "TesteLocal123!";
  const admin=createQaClient(base);
  await api("/login", {method:"POST",token:admin,body:{email:"admin@biblioconnect.com",senha:"admin123"}});
  await api("/usuarios", { method: "POST", status: 201, body: { nome: "Leitor de teste", email, senha,
    cep: "57000000", rua: "Rua de teste", bairro: "Centro", cidade: "Maceió", estado: "AL", numero: "10" } });
  await api("/login", { method: "POST", status: 403, body: { email, senha } });
  const dir = process.env.EMAIL_OUTPUT_DIR || ".emails";
  const nomes = (await fs.readdir(dir)).sort().reverse();
  const html = await fs.readFile(path.join(dir, nomes[0]), "utf8");
  const link = html.match(/https?:[^"\s<>]*\/confirmar-email\/[a-f0-9]+/)[0];
  assert.equal((await fetch(link)).status, 200);
  const cliente=createQaClient(base);
  await api("/login", {method:"POST",token:cliente,body:{email,senha}});
  await api("/admin/usuarios", { token: cliente, status: 403 });
  await api("/livros/abc", { status: 400 });
  await api("/livros", { method: "POST", token: admin, body: { titulo: "Inválido" }, status: 400 });
  const livro = await api("/livros", { method: "POST", token: admin, status: 201, body: {
    titulo: "Livro de integração", autor: "Autor", redator: "Editora", ano: 2025, categoria: "Teste",
    sinopse: "Livro criado por teste automatizado", precoCompra: 20, precoAluguel: 5,
    diasInclusos: 7, precoDiaExtra: 2, estoque: 1,
  } });
  const compra = await api("/comprar", { method: "POST", token: cliente, body: { livroId: livro.id,valor:0.01,valorEntrega:999,precoCompra:0.01 } });
  assert.equal(compra.valor,20);assert.equal(compra.valorEntrega,0);
  await api("/entrega/cotacao",{method:"POST",token:cliente,body:{endereco:{}},status:400});
  const missingFreight=await api("/entrega/cotacao",{method:"POST",token:cliente,body:{endereco:"Praça pública, Maceió"},status:503});
  assert.ok(!JSON.stringify(missingFreight).includes("GOOGLE_MAPS_API_KEY"));
  await api("/comprar", { method: "POST", token: cliente, body: { livroId: livro.id }, status: 400 });
  await api(`/me/pedidos/${compra.id}/cancelar`, { method: "PATCH", token: cliente });
  await api(`/me/pedidos/${compra.id}/cancelar`, { method: "PATCH", token: cliente, status: 400 });
  assert.equal((await api(`/livros/${livro.id}`)).estoque, 1);
  await api("/alugar", { method: "POST", token: cliente, body: { livroId: livro.id, dias: 1.5 }, status: 400 });
  const aluguel = await api("/alugar", { method: "POST", token: cliente, body: { livroId: livro.id, dias: 7 } });
  await api(`/admin/pedidos/${aluguel.id}/pagamento`, { method: "PATCH", token: admin, body: { statusPagamento: "pago" } });
  await api(`/admin/pedidos/${aluguel.id}/status`, { method: "PATCH", token: admin, body: { status: "devolvido" } });
  await api(`/admin/pedidos/${aluguel.id}/status`, { method: "PATCH", token: admin, body: { status: "pendente" }, status: 400 });
  assert.equal((await api(`/livros/${livro.id}`)).estoque, 1);
  // Mesmo com cliques concorrentes só uma unidade pode ser vendida e reposta.
  const comprasParalelas = await Promise.all(Array.from({ length: 4 }, async () => {
    const r = await cliente.fetch("/comprar", { method: "POST", body: { livroId: livro.id } });
    return { status: r.status, dados: await r.json() };
  }));
  assert.equal(comprasParalelas.filter(r => r.status === 200).length, 1);
  const unica = comprasParalelas.find(r => r.status === 200).dados;
  const cancels = await Promise.all(Array.from({ length: 3 }, () => cliente.fetch(`/me/pedidos/${unica.id}/cancelar`, { method: "PATCH" })));
  assert.equal(cancels.filter(r => r.status === 200).length, 1);
  assert.equal((await api(`/livros/${livro.id}`)).estoque, 1);
  const data = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const reserva = await api("/reservar", { method: "POST", token: cliente, body: { livroId: livro.id, dataRetirada: data } });
  await api(`/me/pedidos/${reserva.id}/cancelar`, { method: "PATCH", token: cliente });
  assert.equal((await api(`/livros/${livro.id}`)).estoque, 1);
  const review = await api(`/livros/${livro.id}/avaliacoes`, { method: "POST", token: cliente, status: 201, body: { nota: 5, comentario: "Ótima leitura de teste." } });
  assert.equal((await api(`/livros/${livro.id}/avaliacoes`)).total, 0);
  await api(`/admin/avaliacoes/${review.avaliacao.id}/status`, { method: "PATCH", token: admin, body: { status: "aprovado" } });
  assert.equal((await api(`/livros/${livro.id}/avaliacoes`)).total, 1);
  await api("/chat/mensagens", { method: "POST", token: cliente, status: 201, body: { texto: "Olá, teste de atendimento." } });
  const chat = await api("/chat", { token: cliente });
  await api(`/admin/chat/conversas/${chat.conversa.id}/mensagens`, { method: "POST", token: admin, status: 201, body: { texto: "Resposta de teste." } });
  assert.equal((await api("/chat", { token: cliente })).mensagens.length, 2);
  await api("/admin/dashboard", { token: admin });
  await api("/admin/financeiro", { token: admin });
  await api("/admin/atrasos", { token: admin });
  await api("/webhooks/mercadopago", { method: "POST", body: { data: { id: "123" } }, status: 401 });
  await api("/esqueci-senha", { method: "POST", body: { email } });
  const ultimos = (await fs.readdir(dir)).sort().reverse();
  const resetHtml = await fs.readFile(path.join(dir, ultimos[0]), "utf8");
  const tokenReset = resetHtml.match(/\/redefinir-senha\/([a-f0-9]+)/)[1];
  await api(`/redefinir-senha/${tokenReset}`, { method: "PATCH", body: { novaSenha: "NovaSenha123!" } });
  await api(`/redefinir-senha/${tokenReset}`, { method: "PATCH", body: { novaSenha: "NovaSenha123!" }, status: 400 });
  await api("/me",{token:cliente,status:401});
  await api("/login", { method: "POST", body: { email, senha: "NovaSenha123!" } });
  const fresh=createQaClient(base);await fresh.request("/login",{method:"POST",body:{email,senha:"NovaSenha123!"}});
  const me=await fresh.request("/me");
  await api(`/admin/usuarios/${me.id}/bloqueio`,{token:admin,method:"PATCH",body:{bloqueado:true}});
  await api("/me",{token:fresh,status:401});
  await api(`/admin/usuarios/${me.id}/bloqueio`,{token:admin,method:"PATCH",body:{bloqueado:false}});
  await api("/me",{token:fresh,status:401});
  for(let i=0;i<3;i++)await api("/reenviar-confirmacao",{method:"POST",body:{email:"missing-account@example.test"}});
  await api("/reenviar-confirmacao",{method:"POST",body:{email:"missing-account@example.test"},status:429});
  console.log(`${verificacoes} respostas HTTP verificadas, além das regras de estoque e visibilidade.`);
});
