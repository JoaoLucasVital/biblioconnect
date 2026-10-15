import {StrictMode} from 'react';
import {render,screen,waitFor} from '@testing-library/react';
import {it,expect,vi,beforeEach} from 'vitest';
import {AuthContext} from '../../context/auth.js';
import WelcomeGate from './WelcomeGate.jsx';
import api from '../../api/api.js';
vi.mock('../../api/api.js',()=>({default:{post:vi.fn()}}));
beforeEach(()=>{vi.clearAllMocks();HTMLDialogElement.prototype.showModal=vi.fn();HTMLDialogElement.prototype.close=vi.fn();});
const user={id:7,role:'CLIENTE',welcomeSeenAt:null};
function gate(usuario=user){return <StrictMode><AuthContext.Provider value={{usuario}}><WelcomeGate/></AuthContext.Provider></StrictMode>;}
it('conta nova apresenta uma vez mesmo com remontagem de efeitos do React',async()=>{
  api.post.mockResolvedValue({data:{show:true}});render(gate());
  await waitFor(()=>expect(screen.getByLabelText('Boas-vindas ao BiblioConnect')).toBeInTheDocument());expect(api.post).toHaveBeenCalledTimes(1);
});
it('contas antigas não reivindicam apresentação',()=>{render(gate({...user,welcomeSeenAt:'2026-10-15T00:00:00Z'}));expect(api.post).not.toHaveBeenCalled();});
it('uma apresentação já reivindicada em outra sessão não se repete',async()=>{api.post.mockResolvedValue({data:{show:false}});render(gate());await waitFor(()=>expect(api.post).toHaveBeenCalledOnce());expect(screen.queryByLabelText('Boas-vindas ao BiblioConnect')).toBeNull();});
