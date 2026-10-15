import {test,expect} from '@playwright/test';
import {createConfirmedClient,loginUi} from './helpers.js';
test('cartão fica preso ao início do documento e sai da tela com a rolagem',async({page,request})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const client=await createConfirmedClient({request});await loginUi(page,client);await page.goto('/perfil');
  const frame=page.locator('.bc-lanyard-frame');await expect(frame).toBeAttached();
  for(const width of [1440,360]){
    await page.setViewportSize({width,height:800});await page.evaluate(()=>window.scrollTo(0,0));
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect.poll(()=>frame.evaluate(node=>node.getBoundingClientRect().top)).toBe(0);
    await page.evaluate(()=>window.scrollTo(0,650));
    await expect.poll(()=>frame.evaluate(node=>Math.abs(node.getBoundingClientRect().top+scrollY))).toBeLessThan(1);
    await expect(frame).not.toHaveClass(/bc-lanyard-compact/);
  }
});
