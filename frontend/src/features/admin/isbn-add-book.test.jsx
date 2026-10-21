import {screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {it,expect,vi} from 'vitest';
import AddBooks from '../../pages/AddBooks.jsx';
import {renderWithRouter} from '../../test/renderWithRouter.jsx';
import api from '../../api/api.js';
vi.mock('../../api/api.js',()=>({default:{get:vi.fn(),post:vi.fn()}}));
vi.mock('../../api/bookUpload.js',()=>({prepareBookUpload:async form=>form}));
it('ISBN preenche os campos e envia a capa importada ao salvar, preservando valores e estoque',async()=>{
  const create=Object.getOwnPropertyDescriptor(URL,'createObjectURL'),revoke=Object.getOwnPropertyDescriptor(URL,'revokeObjectURL');
  Object.defineProperty(URL,'createObjectURL',{configurable:true,value:()=> 'blob:imagem-anterior'});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:()=>{}});
  try{
    const data={isbn:'9788532530783',titulo:'Harry Potter e a Pedra Filosofal',autor:'J. K. Rowling',redator:'Rocco',ano:2017,categoria:'Fantasia',sinopse:'Uma aventura em uma escola de magia.',imagemUrl:'https://library.example/api/isbn/9788532530783/capa',camposAusentes:[]};
    api.get.mockResolvedValue({data});api.post.mockResolvedValue({data:{id:1000}});renderWithRouter(<AddBooks/>);const user=userEvent.setup();
    await user.upload(screen.getByLabelText('Imagem da capa'),new File(['old'],'anterior.jpg',{type:'image/jpeg'}));
    for(const [label,value]of [['Estoque','9'],['Preço de compra','35'],['Preço de aluguel','7'],['Dias inclusos','7'],['Preço por dia extra','2']])await user.type(screen.getByLabelText(label),value);
    await user.type(screen.getByLabelText('ISBN'),data.isbn);await user.click(screen.getByRole('button',{name:'Preencher por ISBN'}));
    expect(screen.getByLabelText('Título')).toHaveValue(data.titulo);expect(screen.getByLabelText('Autor')).toHaveValue(data.autor);expect(screen.getByLabelText('Redator/Editora')).toHaveValue(data.redator);expect(screen.getByLabelText('Ano')).toHaveValue(2017);expect(screen.getByLabelText('Categoria')).toHaveValue('Fantasia');expect(screen.getByLabelText('Sinopse')).toHaveValue(data.sinopse);
    expect(screen.getByLabelText('Imagem da capa').files).toHaveLength(0);
    await user.click(screen.getByRole('button',{name:'Cadastrar Livro'}));await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Confirmar',exact:true}));
    expect(api.post).toHaveBeenCalledOnce();const [route,form]=api.post.mock.calls[0];expect(route).toBe('/livros');expect(form.get('imagemUrlExterna')).toBe(data.imagemUrl);expect(form.get('imagem')).toBeNull();expect(form.get('estoque')).toBe('9');expect(form.get('precoCompra')).toBe('35');expect(form.get('titulo')).toBe(data.titulo);
  }finally{for(const [name,descriptor]of [['createObjectURL',create],['revokeObjectURL',revoke]]){if(descriptor)Object.defineProperty(URL,name,descriptor);else Reflect.deleteProperty(URL,name);}}
});
it('mantém a capa manual quando o ISBN não oferece uma substituta',async()=>{
  const create=Object.getOwnPropertyDescriptor(URL,'createObjectURL'),revoke=Object.getOwnPropertyDescriptor(URL,'revokeObjectURL');
  Object.defineProperty(URL,'createObjectURL',{configurable:true,value:()=> 'blob:manual'});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:()=>{}});
  try{
    api.get.mockResolvedValue({data:{isbn:'9788532530783',titulo:'Livro conhecido',imagemUrl:'',camposAusentes:['capa']}});renderWithRouter(<AddBooks/>);const user=userEvent.setup();
    await user.upload(screen.getByLabelText('Imagem da capa'),new File(['manual'],'minha-capa.jpg',{type:'image/jpeg'}));
    await user.type(screen.getByLabelText('ISBN'),'9788532530783');await user.click(screen.getByRole('button',{name:'Preencher por ISBN'}));
    expect(screen.getByLabelText('Imagem da capa').files).toHaveLength(1);expect(screen.getByLabelText('Imagem da capa').files[0].name).toBe('minha-capa.jpg');
  }finally{for(const [name,descriptor]of [['createObjectURL',create],['revokeObjectURL',revoke]]){if(descriptor)Object.defineProperty(URL,name,descriptor);else Reflect.deleteProperty(URL,name);}}
});
