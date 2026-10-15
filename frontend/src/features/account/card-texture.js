export async function makeReaderTextures(usuario,avatarBlob){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1440;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.fillStyle='#172e4d';ctx.fillRect(0,0,1024,1440);
  ctx.fillStyle='#f7ad51';ctx.font='600 50px sans-serif';ctx.fillText('BiblioConnect',64,155);
  ctx.fillStyle='#cbd5e1';ctx.font='24px sans-serif';ctx.fillText('SUA PRÓXIMA LEITURA',64,204);
  if(avatarBlob){
    const url=URL.createObjectURL(avatarBlob);
    try{const image=new Image();image.src=url;await image.decode();const scale=Math.min(960/image.naturalWidth,920/image.naturalHeight);const width=image.naturalWidth*scale,height=image.naturalHeight*scale;ctx.drawImage(image,(1024-width)/2,240+(920-height)/2,width,height);}finally{URL.revokeObjectURL(url);}
  }else{ctx.fillStyle='#f7ad51';ctx.font='180px serif';ctx.textAlign='center';ctx.fillText(usuario.nome.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join(''),512,760);ctx.textAlign='left';}
  ctx.fillStyle='#fff7ed';let size=62;do{ctx.font=`500 ${size}px sans-serif`;if(ctx.measureText(usuario.nome).width<896)break;size-=2;}while(size>24);ctx.fillText(usuario.nome,64,1240,896);
  ctx.font='28px sans-serif';ctx.fillStyle='#cbd5e1';ctx.fillText(`BC-${String(usuario.id).padStart(5,'0')}  ·  ${usuario.role==='ADMIN'?'Equipe da biblioteca':'Cartão de leitor'}`,64,1310);
  const front=canvas.toDataURL('image/png');
  ctx.fillStyle='#172e4d';ctx.fillRect(0,0,1024,1440);ctx.fillStyle='#f7ad51';ctx.font='600 65px serif';ctx.fillText('Um livro.',80,650);ctx.fillText('Muitas conexões.',80,735);ctx.fillStyle='#fff7ed';ctx.font='36px sans-serif';ctx.fillText('BiblioConnect',80,1260);
  return {front,back:canvas.toDataURL('image/png')};
}
