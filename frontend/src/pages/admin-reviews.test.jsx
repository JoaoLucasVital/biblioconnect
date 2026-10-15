import {it,expect,vi} from 'vitest';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderWithRouter} from '../test/renderWithRouter.jsx';
import AdminReviews from './AdminReviews.jsx';
import api from '../api/api.js';
vi.mock('../api/api.js',()=>({default:{get:vi.fn(),patch:vi.fn(),delete:vi.fn()}}));
it('moderação mostra estrelas, preserva comentário e só altera o status solicitado',async()=>{
 api.get.mockResolvedValue({data:[{id:8,nota:4,status:'pendente',comentario:'Uma leitura marcante.',livro:{titulo:'Livro exemplo'},usuario:{nome:'Leitora',email:'reader@example.test'}}]});
 api.patch.mockResolvedValue({data:{}});renderWithRouter(<AdminReviews/>);
 expect(await screen.findByLabelText('4 de 5 estrelas')).toBeVisible();
 await userEvent.click(screen.getByRole('button',{name:'Aprovar avaliação'}));
 expect(api.patch).toHaveBeenCalledWith('/admin/avaliacoes/8/status',{status:'aprovado'});
 expect(screen.getByText('Uma leitura marcante.')).toBeVisible();
});
