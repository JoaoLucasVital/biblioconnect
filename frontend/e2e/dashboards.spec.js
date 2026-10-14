import {test,expect} from "@playwright/test";
import {loginUi} from "./helpers.js";
const emptyStats={reservas:0,vendas:0,alugueis:0,usuarios:2,usuariosBloqueados:0,livros:22,atrasos:0,multasPendentes:0,livrosMaisVendidos:[],generosMaisVendidos:[],livroMaisVendido:null,generoMaisVendido:null};
test("painel principal recupera falha sem mostrar zeros como dados válidos",async({page})=>{
  await loginUi(page,{email:"admin@biblioconnect.com",senha:"admin123"});
  let failed=true;
  await page.route(`${process.env.QA_API_URL}/admin/dashboard`,route=>failed?route.fulfill({status:503,json:{erro:"Painel temporariamente indisponível"}}):route.fulfill({json:emptyStats}));
  await page.goto("/admin");
  await expect(page.getByRole("alert")).toContainText("Painel temporariamente indisponível");
  await expect(page.getByRole("region",{name:"Indicadores da biblioteca"})).toHaveCount(0);
  failed=false;
  await page.getByRole("button",{name:"Tentar novamente"}).click();
  await expect(page.getByRole("region",{name:"Indicadores da biblioteca"}).getByText("22",{exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Ver financeiro",exact:true}).click();
  await expect(page).toHaveURL(/\/admin\/financeiro$/);
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
});
test("marca Elo mantém tema, imagem carregada e navegação em telas pequenas",async({page})=>{
  for(const width of [320,360,768,1440]){
    await page.setViewportSize({width,height:900});await page.goto("/");
    const logo=page.getByRole("img",{name:"BiblioConnect",exact:true});
    await expect.poll(()=>logo.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
    await expect(logo).toHaveAttribute("src","/brandmark.svg");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole("switch",{name:"Tema escuro"}).setChecked(width!==320);
    await expect(logo).toBeVisible();
  }
});
