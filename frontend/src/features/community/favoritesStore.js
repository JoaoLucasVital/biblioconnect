export const emptyFavorite=Object.freeze({total:null,salvo:false,pending:false,error:""});
export function createFavoritesStore({api,createEventSource,apiBase}){
  const values=new Map(),listeners=new Map(),revisions=new Map(),cursors=new Map();
  let userId,source,timer,refreshTimer,generation=0;
  const ids=()=>[...listeners.keys()].sort((a,b)=>a-b).slice(0,50);
  function notify(id,value){values.set(id,value);listeners.get(id)?.forEach(callback=>callback());}
  function update(id,patch){notify(id,{...(values.get(id)||emptyFavorite),...patch});}
  function close(){source?.close();source=null;}
  async function refresh(){
    const selected=ids(),own=generation;if(!selected.length)return {cursor:"0"};
    const versions=new Map(selected.map(id=>[id,revisions.get(id)||0]));
    const {data}=await api.get("/livros/salvos/resumo",{params:{ids:selected.join(",")}});
    if(own!==generation)return {cursor:"0"};
    if(!Array.isArray(data?.itens)||!/^\d+$/.test(String(data.cursor)))throw new Error("Resumo indisponível.");
    for(const item of data.itens){
      const id=item.livroId,current=values.get(id)||emptyFavorite;
      if(!selected.includes(id)||current.pending||(versions.get(id)!==(revisions.get(id)||0))||BigInt(data.cursor)<(cursors.get(id)||0n)||!Number.isSafeInteger(item.total)||item.total<0)continue;
      cursors.set(id,BigInt(data.cursor));update(id,{total:item.total,salvo:Boolean(item.salvo),error:""});
    }
    return data;
  }
  function refreshSoon(){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refresh().catch(()=>{}),100);}
  async function connect(){
    close();const selected=ids(),own=++generation;if(!selected.length)return;
    try{
      const initial=await refresh();if(own!==generation)return;
      source=createEventSource(`${apiBase.replace(/\/$/,"")}/livros/salvos/eventos?ids=${selected.join(",")}&cursor=${initial.cursor}`);
      source.addEventListener("snapshot",event=>{
        if(own!==generation)return;
        try{const data=JSON.parse(event.data);for(const item of data.itens||[]){if(selected.includes(item.livroId)&&Number.isSafeInteger(item.total)&&BigInt(data.cursor)>=(cursors.get(item.livroId)||0n)&&!values.get(item.livroId)?.pending){cursors.set(item.livroId,BigInt(data.cursor));update(item.livroId,{total:item.total});}}refreshSoon();}catch{/* A reconnect will recover the authoritative snapshot. */}
      });
      source.addEventListener("favorite",event=>{
        if(own!==generation)return;
        try{const item=JSON.parse(event.data),id=item.livroId;if(selected.includes(id)&&Number.isSafeInteger(item.total)&&item.total>=0&&BigInt(item.cursor)>(cursors.get(id)||0n)&&!values.get(id)?.pending){cursors.set(id,BigInt(item.cursor));update(id,{total:item.total});}if(userId)refreshSoon();}catch{/* Ignore malformed events; snapshots remain authoritative. */}
      });
      source.onopen=refreshSoon;
      source.onerror=()=>{if(own===generation)for(const id of selected)update(id,{error:"Reconectando a contagem de salvos…"});};
    }catch{if(own===generation){for(const id of selected)update(id,{error:"Contagem indisponível. Tente novamente."});timer=setTimeout(connect,5000);}}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(connect,20);}
  return {
    snapshot:id=>values.get(id)||emptyFavorite,
    subscribe(id,callback){
      if(!Number.isSafeInteger(id)||id<1)return()=>{};
      const existing=listeners.get(id);if(existing)existing.add(callback);else{listeners.set(id,new Set([callback]));schedule();}
      return()=>{const list=listeners.get(id);list?.delete(callback);if(!list?.size){listeners.delete(id);schedule();}};
    },
    setUser(value){if(value===userId)return;userId=value;++generation;close();values.clear();cursors.clear();revisions.clear();for(const callbacks of listeners.values())callbacks.forEach(callback=>callback());schedule();},
    async setSaved(id,salvo){
      const previous=values.get(id)||emptyFavorite;if(previous.pending||previous.total===null)return;
      const ownUser=userId,revision=(revisions.get(id)||0)+1;revisions.set(id,revision);
      update(id,{salvo,total:Math.max(0,previous.total+(salvo?1:-1)),pending:true,error:""});
      try{
        const {data}=await api.put(`/livros/${id}/salvo`,{salvo});if(userId!==ownUser)return;
        revisions.set(id,revision+1);cursors.set(id,BigInt(data.cursor));update(id,{salvo:data.salvo,total:data.total,pending:false,error:""});refreshSoon();return data;
      }catch(error){if(userId===ownUser){revisions.set(id,revision+1);notify(id,{...previous,pending:false,error:error.response?.data?.erro||"Não foi possível atualizar os salvos."});refreshSoon();}throw error;}
    },
    refresh,
    stop(){++generation;close();clearTimeout(timer);clearTimeout(refreshTimer);},
  };
}
