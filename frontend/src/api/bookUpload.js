import api from './api.js';

export async function prepareBookUpload(form){
  const file=form.get('imagem');
  if(!(file instanceof File))return form;
  const {data:ticket}=await api.post('/media/book-upload-ticket',{});
  if(ticket.mode==='local')return form;
  const {uploadPresigned}=await import('@vercel/blob/client');
  await uploadPresigned(ticket.pathname,file,{
    access:'private',contentType:file.type==='image/jpg'?'image/jpeg':file.type,
    handleUploadUrl:`${api.defaults.baseURL.replace(/\/$/,'')}/media/book-upload-token`,
    clientPayload:ticket.ticket,headers:{'X-CSRF-Token':api.getCsrfToken()},
  });
  const {data}=await api.post('/media/book-upload-finalize',{ticket:ticket.ticket});
  form.delete('imagem');form.set('imagemUrlExterna',data.imagemUrl);
  return form;
}
