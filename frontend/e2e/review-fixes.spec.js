import {test,expect} from "@playwright/test";
import {loginUi} from "./helpers.js";

async function contrast(locator) {
  return locator.evaluate(element=>{
    const rgb=color=>color.match(/[\d.]+/g).slice(0,3).map(Number);
    const luminance=color=>rgb(color).map(value=>{
      const channel=value/255;
      return channel<=0.04045?channel/12.92:((channel+0.055)/1.055)**2.4;
    }).reduce((total,value,index)=>total+value*[0.2126,0.7152,0.0722][index],0);
    let surface=element;
    while(surface.parentElement&&getComputedStyle(surface).backgroundColor==="rgba(0, 0, 0, 0)")surface=surface.parentElement;
    const foreground=luminance(getComputedStyle(element).color);
    const background=luminance(getComputedStyle(surface).backgroundColor);
    return (Math.max(foreground,background)+0.05)/(Math.min(foreground,background)+0.05);
  });
}

test("ação primária conserva contraste mínimo em hover",async({page})=>{
  await page.goto("/login");
  const button=page.getByRole("button",{name:"Entrar",exact:true});
  await expect(button).toBeVisible();
  await button.hover();
  await expect.poll(()=>contrast(button)).toBeGreaterThanOrEqual(4.5);
});

test("texto secundário conserva contraste mínimo sobre a página clara",async({page})=>{
  await page.goto("/login");
  await expect(page.getByRole("button",{name:"Entrar",exact:true})).toBeVisible();
  await expect.poll(()=>contrast(page.locator("main .text-muted").first())).toBeGreaterThanOrEqual(4.5);
});

test("resumos de vendas separam o título e o gênero de suas quantidades",async({page})=>{
  await loginUi(page,{email:"admin@biblioconnect.com",senha:"admin123"});
  await page.route(`${process.env.QA_API_URL}/admin/dashboard`,route=>route.fulfill({json:{
    reservas:0,vendas:2,alugueis:0,usuarios:1,usuariosBloqueados:0,livros:1,atrasos:0,multasPendentes:0,
    livrosMaisVendidos:[{titulo:"Memórias além da página",quantidadeVendas:2}],
    generosMaisVendidos:[{genero:"Romance",quantidadeVendas:2}],
    livroMaisVendido:{titulo:"Memórias além da página",quantidadeVendas:2},
    generoMaisVendido:{genero:"Romance",quantidadeVendas:2},
  }}));
  await page.goto("/admin");
  for(const label of ["Livro mais vendido","Gênero mais vendido"]){
    const group=page.getByText(label,{exact:true}).locator("..");
    const title=await group.locator("strong").boundingBox();
    const quantity=await group.locator("small").boundingBox();
    expect(title&&quantity).toBeTruthy();
    expect(title.y+title.height<=quantity.y||title.x+title.width+4<=quantity.x).toBe(true);
  }
});
