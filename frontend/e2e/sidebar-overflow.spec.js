import {test,expect} from '@playwright/test';
import {authHeaders,createBook,createConfirmedClient,loginUi,sessionCredentials} from './helpers.js';

test('painel com dados cabe durante todo o recolhimento e redimensionamento',async({page,request})=>{
  const credentials={email:'admin@biblioconnect.com',senha:'admin123'};
  const response=await request.post(`${process.env.QA_API_URL}/login`,{headers:{Origin:process.env.QA_BASE_URL},data:credentials});
  const admin=await sessionCredentials(response),book=await createBook({request,adminToken:admin}),client=await createConfirmedClient({request});
  const purchase=await request.post(`${process.env.QA_API_URL}/comprar`,{headers:authHeaders(client.token),data:{livroId:book.id}});expect(purchase.ok()).toBe(true);
  const order=await purchase.json();
  expect((await request.patch(`${process.env.QA_API_URL}/pedidos/${order.id}/simular-pagamento`,{headers:authHeaders(client.token)})).ok()).toBe(true);
  await loginUi(page,credentials);await page.goto('/admin');
  await expect(page.locator('.dashboard-chart svg').first()).toBeVisible();
  const nav=page.locator('.bc-admin-rail').getByRole('navigation',{name:'Administração'});
  for(const width of [1440,1100,1024]){
    await page.setViewportSize({width,height:900});
    for(const label of ['Recolher menu','Expandir menu']){
      await page.evaluate(()=>{
        window.sidebarScrollAudit={errors:[],done:false};const until=performance.now()+800;
        const sample=()=>{
          const viewport=document.documentElement.clientWidth,actual=document.documentElement.scrollWidth;
          if(actual>viewport+1)window.sidebarScrollAudit.errors.push({viewport,actual});
          if(performance.now()<until)requestAnimationFrame(sample);else window.sidebarScrollAudit.done=true;
        };requestAnimationFrame(sample);
      });
      await nav.getByRole('button',{name:label,exact:true}).click();
      await expect.poll(()=>page.evaluate(()=>window.sidebarScrollAudit.done)).toBe(true);
      expect(await page.evaluate(()=>window.sidebarScrollAudit.errors.slice(0,4)),`${label} a ${width}px`).toEqual([]);
    }
  }
  for(const width of [768,360]){
    await page.setViewportSize({width,height:800});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  }
});
