import sharp from 'sharp';
import {sanitizeBookCover,bookImageLimit} from './bookMediaService.js';

export function normalizarIsbn(isbn) {
  return String(isbn || "").replace(/[^0-9Xx]/g, "").toUpperCase();
}
const failure=(message,status)=>Object.assign(new Error(message),{status});
const check13=digits=>(10-[...digits].reduce((sum,c,i)=>sum+Number(c)*(i%2?3:1),0)%10)%10;
export function isbnCanonico(value){
  const isbn=normalizarIsbn(value);
  if(/^\d{9}[\dX]$/.test(isbn)&&[...isbn].reduce((sum,c,i)=>sum+(c==='X'?10:Number(c))*(10-i),0)%11===0){const base='978'+isbn.slice(0,9);return base+check13(base);}
  if(/^97[89]\d{10}$/.test(isbn)&&check13(isbn.slice(0,12))===Number(isbn[12]))return isbn;
  throw failure('Informe um ISBN-10 ou ISBN-13 válido.',400);
}
function text(value){return String(typeof value==='object'?value?.value||'':value||'').slice(0,15000).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();}
function category(values){
  const all=values.map(text).join(' ').toLowerCase();
  for(const [pattern,label]of [[/dark romance/,'Dark romance'],[/fantas|magic|magia|wizards/,'Fantasia'],[/thriller|mystery|suspense|horror|crime/,'Suspense'],[/romance|love stories/,'Romance'],[/poetry|poesia/,'Poesia'],[/short stor|contos/,'Contos'],[/drama|teatro/,'Teatro'],[/juvenil|young adult|children/,'Juvenil']])if(pattern.test(all))return label;
  return values.length?'Literatura':'';
}
function coverUrl(value){
  try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.port)return null;
    if(!['covers.openlibrary.org','books.google.com','books.googleusercontent.com'].includes(url.hostname))return null;
    url.protocol='https:';if(url.hostname==='covers.openlibrary.org')url.searchParams.set('default','false');return url.href;
  }catch{return null;}
}
function imageDestination(url,redirect){
  if(coverUrl(url.href))return true;
  if(!redirect)return false;
  if(url.hostname==='archive.org')return /^\/download\/[sml]_covers_\d{4}\/[sml]_covers_\d{4}_\d+\.zip\/\d+-[SML]\.jpg$/.test(url.pathname);
  return /^ia\d+\.us\.archive\.org$/.test(url.hostname)&&url.pathname==='/view_archive.php'&&/^\/\d+\/items\/[sml]_covers_\d{4}\/[sml]_covers_\d{4}_\d+\.zip$/.test(url.searchParams.get('archive')||'')&&/^\d+-[SML]\.jpg$/.test(url.searchParams.get('file')||'')&&[...url.searchParams.keys()].every(key=>['archive','file'].includes(key));
}
async function readBounded(response,limit){
  if(Number(response.headers.get('content-length'))>limit)throw Error('Limite da resposta');
  const parts=[];let size=0;
  for await(const part of response.body){size+=part.length;if(size>limit)throw Error('Limite da resposta');parts.push(part);}
  return Buffer.concat(parts);
}
export function createIsbnService({fetchImpl=globalThis.fetch,now=Date.now,googleKey=process.env.GOOGLE_BOOKS_API_KEY}={}){
  const metadata=new Map(),images=new Map(),pendingImages=new Map();let imageBytes=0,googleUntil=0;
  const headers={'User-Agent':'BiblioConnect/1.0 (biblioconnect.biblioteca@gmail.com)','Accept':'application/json'};
  async function request(address,image=false,signal){
    let url=new URL(address);const originalHost=url.hostname;
    for(let redirects=0;redirects<4;redirects++){
      if(url.protocol!=='https:'||url.username||url.password||url.port||!(image?imageDestination(url,redirects>0):['openlibrary.org','www.googleapis.com'].includes(url.hostname)&&url.hostname===originalHost))throw Error('Origem inválida');
      const response=await fetchImpl(url.href,{headers:{...headers,Accept:image?'image/jpeg,image/png,image/webp':'application/json'},signal:AbortSignal.any([AbortSignal.timeout(6000),...(signal?[signal]:[])]),redirect:'manual'});
      if(response.status>=300&&response.status<400){const location=response.headers.get('location');await response.body?.cancel();if(!location)throw Error('Redirecionamento inválido');url=new URL(location,url);continue;}
      return response;
    }
    throw Error('Redirecionamentos excedidos');
  }
  async function json(url,signal){try{const response=await request(url,false,signal);if(!response.ok){await response.body?.cancel();return {ok:false,status:response.status};}return {ok:true,data:JSON.parse((await readBounded(response,1024*1024)).toString())};}catch{return {ok:false};}}
  async function load(isbn,signal){
    const query=new URLSearchParams({q:`isbn:${isbn}`,maxResults:'5',projection:'full'});if(googleKey)query.set('key',googleKey);
    const [open,google]=await Promise.all([json(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,signal),now()<googleUntil?Promise.resolve({ok:false}):json(`https://www.googleapis.com/books/v1/volumes?${query}`,signal)]);
    if([403,429].includes(google.status))googleUntil=now()+300000;
    const book=open.data?.['ISBN:'+isbn];
    const volume=google.data?.items?.map(item=>item.volumeInfo).find(item=>item?.industryIdentifiers?.some(id=>{try{return isbnCanonico(id.identifier)===isbn;}catch{return false;}}));
    if(!book?.title&&!volume?.title){if(!open.ok&&!google.ok)throw failure('As fontes de livros estão indisponíveis. Tente novamente em alguns instantes.',503);return null;}
    let edition={},work={};
    if(book){const result=await json(`https://openlibrary.org/isbn/${isbn}.json`,signal);edition=result.data||{};
      if(!volume?.description&&!edition.description&&/^\/works\/OL\d+W$/.test(edition.works?.[0]?.key||''))work=(await json(`https://openlibrary.org${edition.works[0].key}.json`,signal)).data||{};
    }
    const date=String(book?.publish_date||volume?.publishedDate||''),year=date.match(/\b(1\d{3}|20\d{2}|21\d{2})\b/),ano=year?Number(year[1]):null;
    const subjects=[...(book?.subjects||[]).map(s=>s.name),...(volume?.categories||[]),...(work.subjects||[])].filter(Boolean);
    const data={isbn,titulo:text(book?.title||volume?.title),autor:text(book?.authors?.map(a=>a.name).filter(Boolean).join(', ')||volume?.authors?.join(', ')),redator:text(book?.publishers?.[0]?.name||volume?.publisher),ano,categoria:category(subjects),sinopse:text(volume?.description||edition.description||work.description),paginas:book?.number_of_pages||volume?.pageCount||null,idioma:edition.languages?.[0]?.key?.split('/').pop()||volume?.language||null,fontes:[...(book?['Open Library']:[]),...(volume?['Google Books']:[])]};
    const covers=[book?.cover?.large,book?.cover?.medium,edition.covers?.find(id=>Number.isSafeInteger(id)&&id>0)?`https://covers.openlibrary.org/b/id/${edition.covers.find(id=>Number.isSafeInteger(id)&&id>0)}-L.jpg`:null,volume?.imageLinks?.large,volume?.imageLinks?.medium,volume?.imageLinks?.thumbnail,volume?.imageLinks?.smallThumbnail].map(coverUrl).filter(Boolean);
    return {data,covers:[...new Set(covers)]};
  }
  async function meta(isbn,signal){
    const existing=metadata.get(isbn);if(existing&&existing.expires>now())return existing.promise;
    metadata.delete(isbn);while(metadata.size>=128)metadata.delete(metadata.keys().next().value);
    const entry={expires:now()+3600000};entry.promise=load(isbn,signal).then(value=>{if(!value)entry.expires=now()+120000;return value;}).catch(error=>{if(metadata.get(isbn)===entry)metadata.delete(isbn);throw error;});metadata.set(isbn,entry);return entry.promise;
  }
  function removeImage(key){const entry=images.get(key);if(entry)imageBytes-=entry.bytes.length;images.delete(key);}
  function cachedImage(isbn){const cached=images.get(isbn);if(cached&&cached.expires>now()){images.delete(isbn);images.set(isbn,cached);return cached;}removeImage(isbn);return null;}
  async function image(isbn,record,signal){
    const cached=cachedImage(isbn);if(cached)return cached;
    if(pendingImages.has(isbn))return pendingImages.get(isbn);
    if(pendingImages.size>=16)throw failure('A capa não está disponível agora.',503);
    const promise=(async()=>{
      for(const url of record?.covers||[]){try{
        const response=await request(url,true,signal);if(!response.ok){await response.body?.cancel();continue;}
        if(!/^image\/(jpeg|png|webp)(?:;|$)/i.test(response.headers.get('content-type')||'')){await response.body?.cancel();continue;}
        const source=await readBounded(response,bookImageLimit),size=await sharp(source,{limitInputPixels:25000000}).metadata();if(size.width<40||size.height<60)continue;
        const bytes=await sanitizeBookCover(source),entry={bytes,url,expires:now()+86400000};
        while(images.size&&(imageBytes+bytes.length>16*1024*1024||images.size>=32))removeImage(images.keys().next().value);
        if(bytes.length<=16*1024*1024){images.set(isbn,entry);imageBytes+=bytes.length;}return entry;
      }catch{/* Uma fonte de capa inválida não invalida os metadados. */}}
      throw failure('Capa não encontrada para este ISBN.',404);
    })();pendingImages.set(isbn,promise);try{return await promise;}finally{pendingImages.delete(isbn);}
  }
  return {
    async lookup(value){const signal=AbortSignal.timeout(20000),isbn=isbnCanonico(value),record=await meta(isbn,signal);if(!record)return null;let imagemUrl='';try{imagemUrl=(await image(isbn,record,signal)).url;}catch{}const data={...record.data,imagemUrl};return {...data,camposAusentes:['titulo','autor','redator','ano','categoria','sinopse'].filter(key=>!data[key]).concat(imagemUrl?[]:['capa'])};},
    async cover(value){const signal=AbortSignal.timeout(20000),isbn=isbnCanonico(value),cached=cachedImage(isbn);return (cached||await image(isbn,await meta(isbn,signal),signal)).bytes;},
  };
}
let defaultService;
const currentService=()=>defaultService??=createIsbnService();
export const buscarLivroPorIsbn=isbn=>currentService().lookup(isbn);
export const buscarCapaPorIsbn=isbn=>currentService().cover(isbn);
