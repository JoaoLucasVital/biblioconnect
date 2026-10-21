import {useState} from 'react';
import {render,screen,act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,it,expect,vi} from 'vitest';
import IsbnLookup from './IsbnLookup.jsx';
import api from '../api/api.js';
vi.mock('../api/api.js',()=>({default:{get:vi.fn()}}));
beforeEach(()=>{api.get.mockReset();});
function Form({onFound,onSubmit}){const[value,setValue]=useState('9788532530783');return <form onSubmit={event=>{event.preventDefault();onSubmit?.();}}><IsbnLookup value={value} onChange={setValue} onFound={onFound}/></form>;}
it('Enter consulta ISBN e não envia o cadastro inteiro',async()=>{
  const found=vi.fn(),submit=vi.fn();api.get.mockResolvedValue({data:{isbn:'9788532530783',titulo:'Livro',camposAusentes:[]}});
  render(<Form onFound={found} onSubmit={submit}/>);await userEvent.click(screen.getByLabelText('ISBN'));await userEvent.keyboard('{Enter}');
  expect(found).toHaveBeenCalledOnce();expect(submit).not.toHaveBeenCalled();
});
it('uma consulta antiga não sobrescreve o ISBN alterado durante a busca',async()=>{
  let resolve;api.get.mockImplementation(()=>new Promise(done=>{resolve=done;}));const found=vi.fn();
  render(<Form onFound={found}/>);await userEvent.click(screen.getByRole('button',{name:'Preencher por ISBN'}));await userEvent.clear(screen.getByLabelText('ISBN'));await userEvent.type(screen.getByLabelText('ISBN'),'9780140449136');
  await act(async()=>resolve({data:{isbn:'9788532530783',titulo:'Antigo'}}));expect(found).not.toHaveBeenCalled();
});
it('informa campos bibliográficos ausentes sem dizer que está tudo preenchido',async()=>{
  api.get.mockResolvedValue({data:{isbn:'9788532530783',titulo:'Livro',camposAusentes:['sinopse','capa']}});
  render(<Form onFound={vi.fn()}/>);await userEvent.click(screen.getByRole('button',{name:'Preencher por ISBN'}));
  expect(await screen.findByRole('status')).toHaveTextContent(/sinopse.*capa/i);
});
it('erro antigo não remove o estado de busca da consulta mais recente',async()=>{
  let rejectOld,resolveNew;
  api.get.mockImplementationOnce(()=>new Promise((_,reject)=>{rejectOld=reject;})).mockImplementationOnce(()=>new Promise(resolve=>{resolveNew=resolve;}));
  render(<Form onFound={vi.fn()}/>);const button=screen.getByRole('button',{name:'Preencher por ISBN'}),input=screen.getByLabelText('ISBN');
  await userEvent.click(button);await userEvent.clear(input);await userEvent.type(input,'9780140449136');await userEvent.click(button);
  await act(async()=>rejectOld({response:{data:{erro:'Erro antigo'}}}));expect(button).toBeDisabled();expect(screen.queryByText('Erro antigo')).not.toBeInTheDocument();
  await act(async()=>resolveNew({data:{isbn:'9780140449136',titulo:'Novo',camposAusentes:[]}}));expect(button).not.toBeDisabled();
});
