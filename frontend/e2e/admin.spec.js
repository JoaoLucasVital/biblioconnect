import {test,expect} from "@playwright/test";
import {createBook,createConfirmedClient,loginUi} from "./helpers.js";
const credentials={email:"admin@biblioconnect.com",senha:"admin123"};
async function adminToken(request){const r=await request.post(`${process.env.QA_API_URL}/login`,{data:credentials});expect(r.ok()).toBe(true);return (await r.json()).token;}
test("criar livro por ISBN e editar estoque reflete no catálogo",async({page,request},info)=>{
  await loginUi(page,credentials);await page.goto("/adicionar-livro");
  await page.route("**/isbn/9788535914849",route=>route.fulfill({json:{isbn:"9788535914849",titulo:"Obra cadastrada pela interface",autor:"Autora QA",redator:"Editora QA",ano:2025,categoria:"Romance",sinopse:"Uma obra para validar o cadastro da biblioteca."}}));
  await page.getByLabel("ISBN",{exact:true}).fill("9788535914849");
  await page.getByRole("button",{name:"Preencher por ISBN"}).click();
  await expect(page.getByLabel("Título",{exact:true})).toHaveValue("Obra cadastrada pela interface");
  for(const [label,value]of [["Preço de compra","20"],["Preço de aluguel","5"],["Dias inclusos","7"],["Preço por dia extra","2"],["Estoque","3"]])await page.getByLabel(label,{exact:false}).fill(value);
  await page.getByRole("button",{name:"Cadastrar Livro",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Confirmar",exact:true}).click();
  await expect(page).toHaveURL(/\/admin\/livros$/);
  const books=await (await request.get(`${process.env.QA_API_URL}/livros`)).json();
  const book=books.find(item=>item.titulo==="Obra cadastrada pela interface");expect(book).toBeTruthy();
  await page.goto(`/editar-livro/${book.id}`);await page.getByLabel("Estoque",{exact:true}).fill("7");
  await page.getByRole("button",{name:"Salvar Alterações",exact:true}).click();
  await expect.poll(async()=>(await(await request.get(`${process.env.QA_API_URL}/livros/${book.id}`)).json()).estoque).toBe(7);
  await page.goto("/livros");await page.getByLabel("Buscar no acervo").fill(book.titulo);
  await expect(page.getByText("Estoque: 7",{exact:false})).toBeVisible();
  await page.setViewportSize({width:360,height:800});await page.goto(`/editar-livro/${book.id}`);
  await expect(page.getByLabel("Estoque",{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath("editar-livro-360.png"),fullPage:true});
});
test("pagamento aprovado permite concluir pedido e financeiro mantém dados reais",async({page,request},info)=>{
  const token=await adminToken(request),book=await createBook({request,adminToken:token}),client=await createConfirmedClient({request});
  const purchase=await request.post(`${process.env.QA_API_URL}/comprar`,{headers:{Authorization:`Bearer ${client.token}`},data:{livroId:book.id}});
  const order=await purchase.json();
  await loginUi(page,credentials);await page.goto("/admin/pedidos");
  await page.getByLabel("Buscar",{exact:true}).fill(book.titulo);
  await expect(page.getByRole("button",{name:"Marcar concluído",exact:true})).toBeDisabled();
  expect((await request.patch(`${process.env.QA_API_URL}/pedidos/${order.id}/simular-pagamento`,{headers:{Authorization:`Bearer ${client.token}`}})).ok()).toBe(true);
  await page.reload();await page.getByLabel("Buscar",{exact:true}).fill(book.titulo);
  await page.getByRole("button",{name:"Marcar concluído",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Confirmar",exact:true}).click();
  await expect.poll(async()=>(await(await request.get(`${process.env.QA_API_URL}/pedidos/${order.id}`,{headers:{Authorization:`Bearer ${token}`}})).json()).status).toBe("concluido");
  await page.goto("/admin/financeiro");await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await page.screenshot({path:info.outputPath("financeiro-1440.png"),fullPage:true});
});
test("gestão de usuário conserva congelar e descongelar",async({page,request})=>{
  const client=await createConfirmedClient({request});
  await loginUi(page,credentials);await page.goto("/admin/usuarios");
  await page.getByLabel("Buscar usuário").fill(client.email);
  await page.getByRole("button",{name:"Congelar",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Confirmar",exact:true}).click();
  await expect(page.getByRole("button",{name:"Descongelar",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Descongelar",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Confirmar",exact:true}).click();
  await expect(page.getByRole("button",{name:"Congelar",exact:true})).toBeVisible();
});
test("administrador aprova avaliação e responde atendimento",async({page,request})=>{
  const token=await adminToken(request),book=await createBook({request,adminToken:token}),client=await createConfirmedClient({request});
  const headers={Authorization:`Bearer ${client.token}`};
  const purchase=await request.post(`${process.env.QA_API_URL}/comprar`,{headers,data:{livroId:book.id}});
  expect(purchase.ok()).toBe(true);
  expect((await request.post(`${process.env.QA_API_URL}/livros/${book.id}/avaliacoes`,{headers,data:{nota:5,comentario:"Comentário aguardando revisão editorial."}})).ok()).toBe(true);
  expect((await request.post(`${process.env.QA_API_URL}/chat/mensagens`,{headers,data:{texto:"Dúvida de teste sobre retirada."}})).ok()).toBe(true);
  await loginUi(page,credentials);await page.goto("/admin/avaliacoes");
  await page.getByRole("article").filter({hasText:book.titulo}).getByRole("button",{name:"Aprovar",exact:true}).click();
  await expect.poll(async()=>(await(await request.get(`${process.env.QA_API_URL}/livros/${book.id}/avaliacoes`)).json()).total).toBe(1);
  await page.goto("/admin/chat");
  await page.getByRole("button").filter({hasText:"Dúvida de teste sobre retirada."}).click();
  await page.getByLabel("Resposta ao cliente").fill("Sua retirada pode ser acompanhada nos pedidos.");
  await page.getByRole("button",{name:"Responder",exact:true}).click();
  await expect(page.getByText("Sua retirada pode ser acompanhada nos pedidos.",{exact:true})).toBeVisible();
});
test("todas as áreas administrativas cabem a 360px com conteúdo longo",async({page,request},info)=>{
  await createBook({request,adminToken:await adminToken(request),overrides:{titulo:"Um título muito longo para testar as margens e a apresentação de um livro no sistema administrativo"}});
  await loginUi(page,credentials);await page.setViewportSize({width:360,height:800});
  for(const route of ["/admin","/admin/livros","/admin/pedidos","/admin/financeiro","/admin/usuarios","/admin/atrasos","/admin/avaliacoes","/admin/chat","/admin/entregas"]){
    await page.goto(route);await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
  }
  await page.goto("/admin");await page.screenshot({path:info.outputPath("painel-360.png"),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:info.outputPath("painel-1440.png"),fullPage:true});
});
test("tabela de entregas contém rolagem e mantém ações acessíveis no celular",async({page})=>{
  await loginUi(page,credentials);await page.setViewportSize({width:360,height:800});
  await page.route("**/admin/pedidos",route=>route.fulfill({json:[{id:99,modalidadeEntrega:"entrega",livro:{titulo:"Uma obra com título extenso que precisa caber em uma tabela administrativa"},usuario:{nome:"Um leitor com nome bastante extenso"},enderecoEntrega:"Rua de teste, 123, Centro, Maceió, AL",valorEntrega:12,distanciaEntregaKm:4,statusEntrega:"preparando"}]}));
  await page.goto("/admin/entregas");
  const region=page.getByRole("region",{name:"Entregas da biblioteca"});
  await expect(region).toBeVisible();
  expect(await region.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
  await region.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
  await expect(region.getByRole("button",{name:"Entregue",exact:true})).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
