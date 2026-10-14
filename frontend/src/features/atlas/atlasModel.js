const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
const categoryOf=book=>String(book.categoria||"").trim()||"Sem categoria";
const compare=(a,b)=>String(a).localeCompare(String(b),"pt-BR",{numeric:true,sensitivity:"base"});

/** Project into collision-free 44px targets using the chart's actual CSS dimensions. */
export function fitAtlasNodes(model,{width,height}) {
  const columns=Math.max(0,Math.floor((width-48)/52));
  const rows=Math.max(0,Math.floor((height-140)/52));
  const capacity=columns*rows;
  if(!capacity)return {...model,nodes:[],edges:[],visibleCount:0};
  const slots=[];
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
    slots.push({x:24+(column+.5)*(width-48)/columns,y:70+(row+.5)*(height-140)/rows});
  }
  const groups=new Map();
  for(const node of model.nodes){if(!groups.has(node.categoryKey))groups.set(node.categoryKey,[]);groups.get(node.categoryKey).push(node);}
  const candidates=[];
  for(let round=0;candidates.length<Math.min(capacity,model.nodes.length);round++){
    for(const group of groups.values())if(group[round] && candidates.length<capacity)candidates.push(group[round]);
  }
  const nodes=candidates.map((node,index)=>{
    const desiredX=node.x*width/1000,desiredY=node.y*height/560;
    let best=0,distance=Infinity;
    slots.forEach((slot,i)=>{const next=(slot.x-desiredX)**2+(slot.y-desiredY)**2;if(next<distance){best=i;distance=next;}});
    const [slot]=slots.splice(best,1);
    // Small deterministic offsets keep the atlas organic; at least49px separates targets.
    const dx=((index*7)%5-2)*.7,dy=((index*11)%5-2)*.7;
    return {...node,x:(slot.x+dx)/width*1000,y:(slot.y+dy)/height*560};
  });
  const ids=new Set(nodes.map(n=>n.id));
  return {...model,nodes,edges:model.edges.filter(e=>ids.has(e.source)&&ids.has(e.target)),visibleCount:nodes.length};
}

/** Public book data only. Coordinates describe a collection, never geographic locations. */
export function buildAtlas(livros=[],{query="",category=""}={}) {
  const all=[...livros].sort((a,b)=>compare(categoryOf(a),categoryOf(b)) || compare(a.titulo,b.titulo) || compare(a.id,b.id));
  const categoryGroups=new Map();
  for(const book of all){
    const name=categoryOf(book),key=normalize(name);
    if(!categoryGroups.has(key))categoryGroups.set(key,{name,count:0,key});
    categoryGroups.get(key).count++;
  }
  const categories=[...categoryGroups.values()];
  const term=normalize(query);
  const books=all.filter(book=>(!category || normalize(categoryOf(book))===normalize(category)) &&
    (!term || normalize(`${book.titulo} ${book.autor} ${categoryOf(book)}`).includes(term)));
  const groups=new Map();
  for(const book of books){
    const key=normalize(categoryOf(book));
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(book);
  }
  // Round-robin sampling keeps one large category from hiding all the others.
  const sampled=[];
  for(let round=0;sampled.length<48;round++){
    let added=false;
    for(const group of groups.values()){
      if(group[round] && sampled.length<48){sampled.push(group[round]);added=true;}
    }
    if(!added)break;
  }
  const sampledGroups=new Map();
  for(const book of sampled){
    const key=normalize(categoryOf(book));
    if(!sampledGroups.has(key))sampledGroups.set(key,[]);
    sampledGroups.get(key).push(book);
  }
  const groupCount=sampledGroups.size;
  const columns=Math.max(1,Math.ceil(Math.sqrt(groupCount*1.5)));
  const rows=Math.max(1,Math.ceil(groupCount/columns));
  const cellWidth=820/columns,cellHeight=370/rows;
  const nodes=[];
  [...sampledGroups.entries()].forEach(([key,group],index)=>{
    const row=Math.floor(index/columns),col=index%columns;
    const columnsInRow=Math.min(columns,groupCount-row*columns);
    const cx=90+(col+(columns-columnsInRow)/2+.5)*cellWidth;
    const cy=100+(row+.5)*cellHeight;
    const radius=Math.min(cellWidth*.32,cellHeight*.34);
    group.forEach((livro,i)=>{
      const angle=i*2.3999632297-.6;
      const r=group.length===1?18:radius*Math.sqrt((i+.5)/group.length);
      nodes.push({id:livro.id,livro,categoryKey:key,x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r,cx,cy});
    });
  });
  const candidates=[];
  const ordered=[...nodes].sort((a,b)=>compare(a.id,b.id));
  for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
    const a=ordered[i],b=ordered[j];
    const sameAuthor=normalize(a.livro.autor) && normalize(a.livro.autor)===normalize(b.livro.autor);
    if(a.categoryKey===b.categoryKey || sameAuthor)candidates.push({source:a.id,target:b.id,
      reason:sameAuthor?"autor":"categoria",distance:Math.hypot(a.x-b.x,a.y-b.y)});
  }
  const degrees=new Map(),edges=[];
  for(const edge of candidates.sort((a,b)=>a.distance-b.distance)){
    if((degrees.get(edge.source)||0)>=3 || (degrees.get(edge.target)||0)>=3)continue;
    edges.push({source:edge.source,target:edge.target,reason:edge.reason});
    degrees.set(edge.source,(degrees.get(edge.source)||0)+1);
    degrees.set(edge.target,(degrees.get(edge.target)||0)+1);
  }
  return {books,categories,nodes,edges,total:books.length,visibleCount:nodes.length};
}
