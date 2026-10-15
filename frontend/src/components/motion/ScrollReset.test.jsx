import {it,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter,Link} from 'react-router-dom';
import {AuthContext} from '../../context/auth.js';
import ScrollReset from './ScrollReset.jsx';
it('volta ao topo ao navegar e ao autenticar na mesma rota',async()=>{
  window.scrollTo=vi.fn();
  const tree=usuario=><AuthContext.Provider value={{usuario}}><MemoryRouter><ScrollReset/><Link to='/chat'>Atendimento</Link></MemoryRouter></AuthContext.Provider>;
  const view=render(tree(null));window.scrollTo.mockClear();
  await userEvent.click(screen.getByRole('link',{name:'Atendimento'}));
  expect(window.scrollTo).toHaveBeenLastCalledWith({top:0,left:0,behavior:'instant'});
  window.scrollTo.mockClear();view.rerender(tree({id:7}));expect(window.scrollTo).toHaveBeenCalledOnce();
});
