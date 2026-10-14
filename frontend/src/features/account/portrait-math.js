const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function suggestPortraitCrop(face,width,height){
  let left=width,top=height,right=0,bottom=0,count=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(face[y*width+x]>.5){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
  if(count<Math.max(12,width*height*.002))throw new Error("Não encontramos um rosto nítido. Use uma foto de frente, com boa iluminação.");
  const fw=(right-left+1)/width,fh=(bottom-top+1)/height,cx=(left+right)/2/width;
  const physicalWidth=Math.max(fw*width*2.2,fh*height*2.6*.8),physicalHeight=physicalWidth/.8;
  const scale=Math.min(1,width/physicalWidth,height/physicalHeight),cropWidth=physicalWidth*scale/width,cropHeight=physicalHeight*scale/height;
  return {x:clamp(cx-cropWidth/2,0,1-cropWidth),y:clamp(top/height-fh*.8,0,1-cropHeight),width:cropWidth,height:cropHeight,face:{left:left/width,top:top/height,right:(right+1)/width,bottom:(bottom+1)/height}};
}
