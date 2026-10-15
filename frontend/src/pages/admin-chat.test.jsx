import {act,fireEvent,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {renderWithRouter} from '../test/renderWithRouter.jsx';
import AdminChat from './AdminChat.jsx';
import api from '../api/api.js';

vi.mock('../api/api.js',()=>({default:{get:vi.fn(),post:vi.fn(),patch:vi.fn()}}));
const first={id:11,status:'aberta',assunto:'Retirada',updatedAt:'2026-10-15T14:00:00Z',usuario:{id:2,nome:'Ana Leitora',email:'ana@example.test'},mensagens:[{id:101,texto:'Posso retirar o livro amanhã?',createdAt:'2026-10-15T14:00:00Z',remetenteRole:'CLIENTE',remetente:{nome:'Ana Leitora'}}]};
const second={id:12,status:'encerrada',updatedAt:'2026-10-15T13:00:00Z',usuario:{id:3,nome:'Bruno Leitor',email:'bruno@example.test'},mensagens:[{id:102,texto:'Obrigada pela visita.',createdAt:'2026-10-15T13:00:00Z',remetenteRole:'ADMIN',remetente:{nome:'Bibliotecária'}}]};
const reply={id:103,texto:'Pode sim, seu livro está separado.',createdAt:'2026-10-15T14:05:00Z',remetenteRole:'ADMIN',remetente:{nome:'Bibliotecária'}};
beforeEach(()=>{
  api.get.mockReset();api.post.mockReset();api.patch.mockReset();
  api.get.mockImplementation(async url=>({data:url==='/admin/chat/conversas'?[first,second]:url.endsWith('/11')?first:second}));
  api.post.mockResolvedValue({data:reply});api.patch.mockResolvedValue({data:{...first,status:'encerrada'}});
});
const setup=()=>renderWithRouter(<AdminChat/>,{route:'/admin/chat'});
const conversation=()=>screen.getByRole('button',{name:/Ana Leitora.*Posso retirar/});
describe('caixa de entrada administrativa',()=>{
  it('busca e filtra conversas com o último texto recebido da API',async()=>{
    const user=userEvent.setup();setup();await screen.findByRole('button',{name:/Bruno Leitor/});
    await user.type(screen.getByRole('searchbox',{name:'Buscar conversas'}),'ana');
    expect(conversation()).toBeVisible();expect(screen.queryByRole('button',{name:/Bruno Leitor/})).not.toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox',{name:'Buscar conversas'}));
    await user.click(screen.getByRole('button',{name:/Encerradas/}));
    expect(screen.queryByRole('button',{name:/Ana Leitora/})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:/Bruno Leitor/})).toBeVisible();
  });
  it('responde na conversa selecionada e distingue as mensagens da equipe',async()=>{
    const user=userEvent.setup();setup();await user.click(await screen.findByRole('button',{name:/Ana Leitora/}));
    const log=await screen.findByRole('log',{name:'Mensagens da conversa'});
    expect(within(log).getByText('Posso retirar o livro amanhã?')).toBeVisible();
    const send=screen.getByRole('button',{name:'Responder',exact:true});expect(send).toBeDisabled();
    await user.type(screen.getByLabelText('Resposta ao cliente'),reply.texto);
    api.get.mockImplementation(async url=>({data:url==='/admin/chat/conversas'?[first,second]:{...first,mensagens:[...first.mensagens,reply]}}));
    await user.click(send);
    await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/admin/chat/conversas/11/mensagens',{texto:reply.texto},expect.any(Object)));
    expect(await within(log).findByText('Equipe BiblioConnect')).toBeVisible();
    expect(screen.getByLabelText('Resposta ao cliente')).toHaveValue('');
  });
  it('exibe histórico encerrado sem campo de resposta',async()=>{
    const user=userEvent.setup();setup();await user.click(await screen.findByRole('button',{name:/Bruno Leitor/}));
    expect(await screen.findByText('Esta conversa foi encerrada. O histórico continua disponível.')).toBeVisible();
    expect(screen.queryByLabelText('Resposta ao cliente')).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Encerrar',exact:true})).not.toBeInTheDocument();
  });
  it('encerra pela rota existente e conserva o histórico selecionado',async()=>{
    const user=userEvent.setup();setup();await user.click(await screen.findByRole('button',{name:/Ana Leitora/}));
    await user.click(await screen.findByRole('button',{name:'Encerrar',exact:true}));
    await waitFor(()=>expect(api.patch).toHaveBeenCalledWith('/admin/chat/conversas/11/status',{status:'encerrada'},expect.any(Object)));
    expect(await screen.findByText('Esta conversa foi encerrada. O histórico continua disponível.')).toBeVisible();
    expect(screen.getByRole('log',{name:'Mensagens da conversa'})).toHaveTextContent('Posso retirar');
  });
  it('ignora resposta atrasada de outra conversa',async()=>{
    const user=userEvent.setup();let resolveFirst;
    api.get.mockImplementation(url=>url.endsWith('/11')?new Promise(resolve=>{resolveFirst=resolve;}):Promise.resolve({data:url==='/admin/chat/conversas'?[first,second]:second}));
    setup();await user.click(await screen.findByRole('button',{name:/Ana Leitora/}));
    await user.click(screen.getByRole('button',{name:/Bruno Leitor/}));
    await screen.findByText('Esta conversa foi encerrada. O histórico continua disponível.');
    await act(async()=>resolveFirst({data:first}));
    expect(screen.getByRole('region',{name:'Conversa com Bruno Leitor'})).toBeVisible();
    expect(screen.queryByLabelText('Resposta ao cliente')).not.toBeInTheDocument();
  });
  it('não reabre uma conversa encerrada quando uma atualização antiga chega depois',async()=>{
    const user=userEvent.setup();setup();await user.click(await screen.findByRole('button',{name:/Ana Leitora/}));
    await screen.findByLabelText('Resposta ao cliente');let resolveStale;
    api.get.mockImplementation(url=>url.endsWith('/11')?new Promise(resolve=>{resolveStale=resolve;}):Promise.resolve({data:[first,second]}));
    await user.click(screen.getByRole('button',{name:'Atualizar'}));
    await waitFor(()=>expect(resolveStale).toBeTypeOf('function'));
    await user.click(screen.getByRole('button',{name:'Encerrar',exact:true}));
    await screen.findByText('Esta conversa foi encerrada. O histórico continua disponível.');
    await act(async()=>resolveStale({data:first}));
    expect(screen.getByText('Esta conversa foi encerrada. O histórico continua disponível.')).toBeVisible();
    expect(screen.queryByLabelText('Resposta ao cliente')).not.toBeInTheDocument();
  });
  it('mantém um rascunho por conversa ao consultar outro histórico',async()=>{
    const user=userEvent.setup();setup();await user.click(await screen.findByRole('button',{name:/Ana Leitora/}));
    await user.type(await screen.findByLabelText('Resposta ao cliente'),'Estou verificando seu pedido.');
    await user.click(screen.getByRole('button',{name:/Bruno Leitor/}));
    await screen.findByText('Esta conversa foi encerrada. O histórico continua disponível.');
    await user.click(screen.getByRole('button',{name:/Ana Leitora/}));
    expect(await screen.findByLabelText('Resposta ao cliente')).toHaveValue('Estou verificando seu pedido.');
  });
  it('recarrega a lista após erro sem perder a recuperação',async()=>{
    api.get.mockRejectedValueOnce(new Error('Rede indisponível'));setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao carregar conversas');
    fireEvent.click(screen.getByRole('button',{name:'Tentar novamente'}));
    expect(await screen.findByRole('button',{name:/Ana Leitora/})).toBeVisible();
  });
});
