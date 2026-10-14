import { test,expect } from "@playwright/test";
import { livroDisponivel } from "../src/test/fixtures.js";

const publicBooks=[
  {...livroDisponivel,id:101,titulo:"Dom Casmurro",autor:"Machado de Assis",categoria:"Romance",imagemUrl:null},
  {...livroDisponivel,id:102,titulo:"Memórias Póstumas de Brás Cubas",autor:"Machado de Assis",categoria:"Realismo",imagemUrl:null},
  {...livroDisponivel,id:103,titulo:"O Cortiço",autor:"Aluísio Azevedo",categoria:"Romance",estoque:0,imagemUrl:null},
];
test.beforeEach(async({page})=>{
  await page.route(`${process.env.QA_API_URL}/livros`,route=>route.fulfill({json:publicBooks}));
});

test("mapa por teclado mostra detalhes reais e busca por acento",async({page})=>{
  await page.setViewportSize({width:1440,height:1000}); await page.goto("/");
  const atlas=page.getByRole("region",{name:"Atlas do Acervo",exact:true});
  const node=atlas.getByRole("button",{name:"Ver O Cortiço, de Aluísio Azevedo",exact:true});
  await node.focus(); await page.keyboard.press("Enter");
  const panel=atlas.getByRole("region",{name:"Livro selecionado"});
  await expect(panel.getByRole("heading",{name:"O Cortiço",exact:true})).toBeVisible();
  await expect(panel.getByText("Sem estoque no momento")).toBeVisible();
  await expect(panel.getByRole("link",{name:"Consultar no catálogo"})).toHaveAttribute("href","/livros");
  await atlas.getByRole("searchbox").fill("memorias");
  await expect(atlas.getByRole("button",{name:"Ver Memórias Póstumas de Brás Cubas, de Machado de Assis"})).toBeVisible();
  await expect(node).toHaveCount(0);
  await atlas.getByRole("searchbox").fill("sem resultado");
  await expect(atlas.getByRole("heading",{name:"Nenhuma leitura encontrada"})).toBeVisible();
  await expect(panel).toHaveCount(0);
});

test("celular usa lista legível, sem transbordamento, e tema sobrevive ao reload",async({page})=>{
  await page.setViewportSize({width:390,height:844}); await page.goto("/");
  const atlas=page.getByRole("region",{name:"Atlas do Acervo",exact:true});
  await expect(atlas.getByRole("list",{name:"Livros no Atlas"})).toBeVisible();
  await expect(atlas.getByRole("group",{name:"Mapa de livros e categorias"})).toHaveCount(0);
  await atlas.getByRole("button",{name:"Ver O Cortiço, de Aluísio Azevedo",exact:true}).click();
  await expect(atlas.getByRole("region",{name:"Livro selecionado"}).getByRole("heading",{name:"O Cortiço"})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole("switch",{name:"Tema escuro"}).check(); await page.reload();
  await expect(page.getByRole("switch",{name:"Tema escuro"})).toBeChecked();
  await expect(page.locator("body")).toHaveClass(/dark/);
});

test("movimento reduzido usa lista e mantém texto e operações disponíveis",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"}); await page.goto("/");
  const atlas=page.getByRole("region",{name:"Atlas do Acervo",exact:true});
  await expect(atlas.getByRole("list",{name:"Livros no Atlas"})).toBeVisible();
  await expect(atlas.getByRole("heading",{name:"Atlas do acervo.",exact:true})).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(atlas.getByRole("link",{name:"Abrir catálogo"})).toHaveAttribute("href","/livros");
});

test("mapa denso em tablet mantém cada alvo de livro livre para clique",async({page})=>{
  const many=Array.from({length:200},(_,i)=>({...publicBooks[0],id:i+1,titulo:`Leitura ${String(i).padStart(3,"0")}`}));
  await page.route(`${process.env.QA_API_URL}/livros`,route=>route.fulfill({json:many}));
  await page.setViewportSize({width:768,height:1100}); await page.goto("/");
  const points=page.locator(".atlas-node"); await expect(points).toHaveCount(48);
  const misses=await points.evaluateAll(elements=>elements.flatMap(element=>{
    const r=element.getBoundingClientRect();
    const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest(".atlas-node");
    return hit===element?[]:[{expected:element.getAttribute("aria-label"),received:hit?.getAttribute("aria-label")}];
  }));
  expect(misses).toEqual([]);
  for(const point of await points.all()){
    const box=await point.boundingBox(); await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    await expect(point).toHaveAttribute("aria-pressed","true");
  }
  await expect(page.getByRole("region",{name:"Atlas do Acervo",exact:true}).getByRole("status")).toContainText("200 livros encontrados");
});
