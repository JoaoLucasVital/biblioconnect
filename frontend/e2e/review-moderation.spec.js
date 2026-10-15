import {test,expect} from '@playwright/test';
import {createConfirmedClient,createBook,sessionCredentials,authHeaders,loginUi} from './helpers.js';
import {captureReview} from './capture-review.js';
test('estrelas e ações de moderação publicam e ocultam a avaliação real',async({page,request})=>{
  const login=await request.post(`${process.env.QA_API_URL}/login`,{headers:{Origin:process.env.QA_BASE_URL},data:{email:'admin@biblioconnect.com',senha:'admin123'}}),admin=await sessionCredentials(login);
  const book=await createBook({request,adminToken:admin,overrides:{titulo:'Histórias que ficam com a gente'}}),client=await createConfirmedClient({request});
  const order=await request.post(`${process.env.QA_API_URL}/comprar`,{headers:authHeaders(client.token),data:{livroId:book.id,modalidadeEntrega:'retirada'}});expect(order.ok()).toBe(true);
  const sent=await request.post(`${process.env.QA_API_URL}/livros/${book.id}/avaliacoes`,{headers:authHeaders(client.token),data:{nota:5,comentario:'Uma leitura envolvente, com personagens que continuam com você depois da última página.'}});expect(sent.status()).toBe(201);
  await loginUi(page,{email:'admin@biblioconnect.com',senha:'admin123'});await page.goto('/admin/avaliacoes');
  await expect(page.getByRole('heading',{name:'Vozes do acervo.'})).toBeVisible();await expect(page.getByLabel('5 de 5 estrelas')).toBeVisible();
  await captureReview(page,'moderacao-estrelas',{fullPage:true});
  await page.getByRole('button',{name:'Aprovar avaliação'}).click();await expect(page.getByRole('button',{name:'Aprovar avaliação'})).toBeDisabled();
  expect((await(await request.get(`${process.env.QA_API_URL}/livros/${book.id}/avaliacoes`)).json()).total).toBe(1);
  await page.getByRole('button',{name:'Ocultar avaliação'}).click();await expect(page.getByRole('button',{name:'Ocultar avaliação'})).toBeDisabled();
  expect((await(await request.get(`${process.env.QA_API_URL}/livros/${book.id}/avaliacoes`)).json()).total).toBe(0);
  await page.setViewportSize({width:360,height:800});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
