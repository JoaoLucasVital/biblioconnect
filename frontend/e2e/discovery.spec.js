import {test,expect} from "@playwright/test";
import {livroDisponivel} from "../src/test/fixtures.js";
const books=[
  {...livroDisponivel,id:201,titulo:"Uma fantasia em destaque",categoria:"Fantasia",imagemUrl:null},
  {...livroDisponivel,id:202,titulo:"Um suspense em destaque",categoria:"Suspense",imagemUrl:null},
  {...livroDisponivel,id:203,titulo:"Um romance em destaque",categoria:"Dark romance",imagemUrl:null},
  {...livroDisponivel,id:204,titulo:"Clássico preservado",destaque:false,imagemUrl:null},
];
test.beforeEach(async({page})=>{
  await page.route(`${process.env.QA_API_URL}/livros`,route=>route.fulfill({json:books}));
});
test("hero continua com mouse e foco e leva da capa ao livro filtrado",async({page})=>{
  await page.goto("/");
  const hero=page.getByRole("region",{name:"Histórias em movimento"});
  await expect(hero.getByRole("heading",{level:1})).toHaveText(/Sua próxima obsessão literária/);
  expect(await hero.locator('[data-book-id="204"]').count()).toBe(0);
  await expect(page.getByRole("button",{name:/Pausar|Retomar/})).toHaveCount(0);
  await hero.hover();
  await expect(hero.locator(".stream-book").first()).toHaveCSS("animation-play-state","running");
  await hero.getByRole("link",{name:"Ver leituras em destaque"}).focus();
  const firstFrame=await hero.locator(".stream-book").first().evaluate(el=>getComputedStyle(el).transform);
  await expect.poll(()=>hero.locator(".stream-book").first().evaluate(el=>getComputedStyle(el).transform)).not.toBe(firstFrame);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("region",{name:"Só mais um capítulo."}).getByRole("link",{name:"Explorar o acervo",exact:true})).toBeFocused();
  await page.getByRole("link",{name:`Encontrar ${books[1].titulo} no catálogo`}).click();
  const catalog=page.getByRole("region",{name:"Catálogo de livros"});
  await expect(catalog.getByRole("article")).toHaveCount(1);
  await expect(catalog.getByRole("heading",{name:books[1].titulo,exact:true})).toBeVisible();
  await expect(page.getByLabel("Buscar no acervo")).toHaveValue(books[1].titulo);
  await expect(page.getByRole("region",{name:"Atlas do Acervo"})).toBeAttached();
});
test("Atlas seleciona livro e consulta na listagem sem recarregar a página",async({page})=>{
  await page.goto("/livros");
  const atlas=page.getByRole("region",{name:"Atlas do Acervo"});
  await atlas.getByRole("button",{name:`Ver ${books[2].titulo}, de ${books[2].autor}`,exact:true}).click();
  await atlas.getByRole("link",{name:"Consultar no catálogo"}).click();
  const catalog=page.getByRole("region",{name:"Catálogo de livros"});
  await expect(catalog.getByRole("article")).toHaveCount(1);
  await expect(catalog.getByRole("heading",{name:books[2].titulo,exact:true})).toBeVisible();
  await catalog.getByRole("button",{name:"Limpar filtros"}).click();
  await expect(catalog.getByRole("heading",{name:books[3].titulo,exact:true})).toBeVisible();
});
test("hero mobile e reduced motion mantêm a seleção sem transbordamento",async({page})=>{
  await page.setViewportSize({width:360,height:800});await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");
  const hero=page.getByRole("region",{name:"Histórias em movimento"});
  await expect(hero).toHaveAttribute("data-paused","true");
  await expect(hero.locator(".stream-book").first()).toHaveCSS("animation-play-state","paused");
  await expect(hero.getByRole("link",{name:"Explorar leituras"})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole("button",{name:"Abrir navegação"}).click();
  await expect(page.getByRole("dialog",{name:"Navegação"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button",{name:"Abrir navegação"})).toBeFocused();
});
