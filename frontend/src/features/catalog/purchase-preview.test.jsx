import {render,screen,fireEvent} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
import PurchaseDialog from './PurchaseDialog.jsx';
it('a prévia do catálogo apenas encaminha para o checkout, sem frete nem confirmação de compra',()=>{
  const next=vi.fn();render(<PurchaseDialog livro={{id:1,titulo:'Livro de teste',precoCompra:30}} onContinuar={next} onClose={()=>{}}/>);
  expect(screen.queryByRole('button',{name:'Calcular frete'})).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Confirmar compra',exact:true})).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Confirmar sem segurar'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Continuar para checkout'}));expect(next).toHaveBeenCalledTimes(1);
});
