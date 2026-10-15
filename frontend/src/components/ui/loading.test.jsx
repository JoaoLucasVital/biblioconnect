import {it,expect,vi} from 'vitest';
import {render,screen,act} from '@testing-library/react';
import LoadingProvider from './LoadingProvider.jsx';
import BookLoader from './BookLoader.jsx';
it('duas operações simultâneas exibem um único loading e removem-no ao terminar',()=>{
  vi.useFakeTimers();
  const tree=(a,b)=><LoadingProvider>{a&&<BookLoader label='Abrindo página'/>}{b&&<BookLoader label='Carregando dados'/>}</LoadingProvider>;
  const view=render(tree(true,true));act(()=>vi.advanceTimersByTime(180));
  expect(screen.getAllByRole('status')).toHaveLength(1);
  view.rerender(tree(false,true));expect(screen.getAllByRole('status')).toHaveLength(1);
  view.rerender(tree(false,false));expect(screen.queryByRole('status')).toBeNull();vi.useRealTimers();
});
