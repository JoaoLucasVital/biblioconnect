import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {Suspense} from 'react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {clientRoutes} from '../../routes.js';
import {AuthContext} from '../../context/auth.js';
import {livroDisponivel} from '../../test/fixtures.js';
import api from '../../api/api.js';
vi.mock('../../api/api.js',()=>({default:{get:vi.fn(),post:vi.fn()}}));
const Checkout=clientRoutes.find(route=>route.path==='/checkout/:livroId')?.Component;
beforeEach(()=>{api.get.mockResolvedValue({data:livroDisponivel});api.post.mockReset();});
afterEach(()=>vi.unstubAllGlobals());
function mount(){render(<AuthContext.Provider value={{isAuthenticated:true,usuario:{id:1}}}><MemoryRouter initialEntries={['/checkout/7']}><Suspense fallback={<p>Carregando checkout</p>}><Routes><Route path='/checkout/:livroId' element={Checkout?<Checkout/>:null}/><Route path='/pedido-confirmado/:id' element={<h1>Pedido criado</h1>}/></Routes></Suspense></MemoryRouter></AuthContext.Provider>);}
it('checkout é uma etapa protegida e abrir a página não cria pedido',async()=>{
  expect(Checkout,'a rota de checkout precisa existir').toBeDefined();mount();
  expect(await screen.findByRole('heading',{name:'Finalize sua leitura.'})).toBeVisible();
  expect(screen.getByRole('button',{name:'Confirmar compra',exact:true})).toBeEnabled();
  expect(screen.queryByRole('button',{name:'Confirmar sem segurar'})).not.toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
});
it('CEP preenche o endereço; alterar número invalida frete e a confirmação fica bloqueada',async()=>{
  expect(Checkout).toBeDefined();
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({logradouro:'Rua José de Alencar',bairro:'Farol',localidade:'Maceió',uf:'AL'})}));
  api.post.mockResolvedValue({data:{distanciaKm:2.5,valorEntrega:11.25,provedor:'openrouteservice',destinoEncontrado:'Rua José de Alencar, Maceió'}});
  mount();await screen.findByRole('heading',{name:'Finalize sua leitura.'});
  fireEvent.click(screen.getByRole('radio',{name:/Receber em casa/}));
  fireEvent.change(screen.getByLabelText('CEP'),{target:{value:'57051565'}});
  await waitFor(()=>expect(screen.getByLabelText('Rua / Avenida')).toHaveValue('Rua José de Alencar'));
  expect(screen.getByLabelText('Cidade')).toHaveValue('Maceió');
  fireEvent.change(screen.getByLabelText('Número'),{target:{value:'511'}});
  fireEvent.click(screen.getByRole('button',{name:'Calcular frete'}));
  expect(await screen.findByText('Distância: 2.5 km')).toBeVisible();
  expect(api.post).toHaveBeenCalledWith('/entrega/cotacao',{endereco:'Rua José de Alencar, 511, Farol, Maceió, AL, 57051-565, Brasil'});
  expect(screen.getByRole('button',{name:'Confirmar compra',exact:true})).toBeEnabled();
  fireEvent.change(screen.getByLabelText('Número'),{target:{value:'512'}});
  expect(screen.queryByText('Distância: 2.5 km')).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Confirmar compra',exact:true})).toBeDisabled();
  expect(api.post.mock.calls.some(([url])=>url==='/comprar')).toBe(false);
});
it('CEP indisponível mantém preenchimento manual e dados digitados',async()=>{
  expect(Checkout).toBeDefined();vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));mount();await screen.findByRole('heading',{name:'Finalize sua leitura.'});
  fireEvent.click(screen.getByRole('radio',{name:/Receber em casa/}));fireEvent.change(screen.getByLabelText('Rua / Avenida'),{target:{value:'Minha rua'}});
  fireEvent.change(screen.getByLabelText('CEP'),{target:{value:'57051565'}});
  expect(await screen.findByText(/Preencha o endereço manualmente/)).toBeVisible();expect(screen.getByLabelText('Rua / Avenida')).toHaveValue('Minha rua');
});
it('somente completar a pressão no checkout cria uma compra, sem valores enviados pelo navegador',async()=>{
  expect(Checkout).toBeDefined();api.post.mockResolvedValue({data:{id:99}});mount();await screen.findByRole('heading',{name:'Finalize sua leitura.'});
  const button=screen.getByRole('button',{name:'Confirmar compra',exact:true});
  fireEvent.click(button);expect(api.post).not.toHaveBeenCalled();
  fireEvent.pointerDown(button,{button:0});await act(async()=>{await new Promise(resolve=>setTimeout(resolve,1250));});
  expect(api.post).toHaveBeenCalledExactlyOnceWith('/comprar',{livroId:7,modalidadeEntrega:'retirada',enderecoEntrega:undefined});
  expect(await screen.findByRole('heading',{name:'Pedido criado'})).toBeVisible();
});
it('endereço completo da cotação é o mesmo enviado na compra, incluindo complemento',async()=>{
  expect(Checkout).toBeDefined();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({logradouro:'Rua José de Alencar',bairro:'Farol',localidade:'Maceió',uf:'AL'})}));
  api.post.mockImplementation(async url=>({data:url==='/comprar'?{id:99}:{distanciaKm:2.5,valorEntrega:11.25}}));
  mount();await screen.findByRole('heading',{name:'Finalize sua leitura.'});fireEvent.click(screen.getByRole('radio',{name:/Receber em casa/}));fireEvent.change(screen.getByLabelText('CEP'),{target:{value:'57051565'}});
  await waitFor(()=>expect(screen.getByLabelText('Rua / Avenida')).toHaveValue('Rua José de Alencar'));fireEvent.change(screen.getByLabelText('Número'),{target:{value:'511'}});fireEvent.change(screen.getByLabelText('Complemento'),{target:{value:'Bloco B'}});
  fireEvent.click(screen.getByRole('button',{name:'Calcular frete'}));await screen.findByText('Distância: 2.5 km');
  expect(api.post.mock.calls[0][1].endereco).toContain('Bloco B');
  fireEvent.pointerDown(screen.getByRole('button',{name:'Confirmar compra',exact:true}),{button:0});await act(async()=>{await new Promise(resolve=>setTimeout(resolve,1250));});
  expect(api.post.mock.calls[1][1].enderecoEntrega).toBe(api.post.mock.calls[0][1].endereco);
});
