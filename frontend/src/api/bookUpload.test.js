import {describe,it,expect,vi,beforeEach} from 'vitest';
const {post,uploadPresigned}=vi.hoisted(()=>({post:vi.fn(),uploadPresigned:vi.fn()}));
vi.mock('./api.js',()=>({default:{post,defaults:{baseURL:'/api'},getCsrfToken:()=> 'csrf-test'}}));
vi.mock('@vercel/blob/client',()=>({uploadPresigned}));
import {prepareBookUpload} from './bookUpload.js';
describe('book upload',()=>{
  beforeEach(()=>{post.mockReset();uploadPresigned.mockReset();});
  it('preserves the local multipart upload',async()=>{
    post.mockResolvedValue({data:{mode:'local'}});const form=new FormData();form.set('imagem',new File(['image'],'cover.png',{type:'image/png'}));
    expect((await prepareBookUpload(form)).has('imagem')).toBe(true);expect(uploadPresigned).not.toHaveBeenCalled();
  });
  it('uploads 5 MB directly with CSRF, then submits only the finalized URL',async()=>{
    post.mockResolvedValueOnce({data:{mode:'blob',pathname:'book-staging/1/id',ticket:'signed-ticket'}}).mockResolvedValueOnce({data:{imagemUrl:'https://covers.example/cover.webp'}});
    const form=new FormData();form.set('titulo','Livro');form.set('imagem',new File([new Uint8Array(5*1024*1024)],'cover.png',{type:'image/png'}));
    await prepareBookUpload(form);
    expect(uploadPresigned).toHaveBeenCalledWith('book-staging/1/id',expect.any(File),expect.objectContaining({handleUploadUrl:'/api/media/book-upload-token',headers:{'X-CSRF-Token':'csrf-test'},access:'private'}));
    expect(form.has('imagem')).toBe(false);expect(form.get('imagemUrlExterna')).toContain('cover.webp');expect(form.get('titulo')).toBe('Livro');
  });
  it('keeps the selected file on upload failure so the administrator can retry',async()=>{
    post.mockResolvedValueOnce({data:{mode:'blob',pathname:'key',ticket:'ticket'}});uploadPresigned.mockRejectedValue(new Error('network'));
    const form=new FormData();form.set('imagem',new File(['image'],'cover.png'));
    await expect(prepareBookUpload(form)).rejects.toThrow('network');expect(form.has('imagem')).toBe(true);expect(post).toHaveBeenCalledTimes(1);
  });
});
