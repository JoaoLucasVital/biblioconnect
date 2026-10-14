import assert from "node:assert/strict";

export function createQaClient(baseUrl,{origin=baseUrl}={}){
  const base=new URL(baseUrl);
  if(!["localhost","127.0.0.1"].includes(base.hostname) || base.protocol!=="http:")throw new Error("Cliente QA exige API HTTP local.");
  const cookies=new Map();
  let csrfToken=null;
  async function fetchResponse(route,{method="GET",body,form}={}){
    const url=new URL(route,base);
    if(url.origin!==base.origin)throw new Error("Cliente QA não envia credenciais para outra origem.");
    const cookieHeader=[...cookies.values()].filter(cookie=>(!cookie.expires || cookie.expires>Date.now()) && (url.pathname===cookie.path || url.pathname.startsWith(cookie.path.endsWith("/")?cookie.path:`${cookie.path}/`))).map(cookie=>`${cookie.name}=${cookie.value}`).join("; ");
    const response=await fetch(url,{method,redirect:"manual",headers:{Origin:origin,...(body!==undefined?{"Content-Type":"application/json"}:{}),...(cookieHeader?{Cookie:cookieHeader}:{}),...(!["GET","HEAD","OPTIONS"].includes(method.toUpperCase())&&csrfToken?{"X-CSRF-Token":csrfToken}:{})},body:form??(body!==undefined?JSON.stringify(body):undefined)});
    for(const raw of response.headers.getSetCookie()){
      const [pair,...attributes]=raw.split(";");
      const index=pair.indexOf("=");
      const cookie={name:pair.slice(0,index).trim(),value:pair.slice(index+1),path:"/",expires:null};
      for(const attribute of attributes){
        const [name,...rest]=attribute.trim().split("="),value=rest.join("=");
        if(name.toLowerCase()==="path")cookie.path=value;
        if(name.toLowerCase()==="max-age")cookie.expires=Date.now()+Number(value)*1000;
        if(name.toLowerCase()==="expires"&&!cookie.expires)cookie.expires=Date.parse(value);
      }
      const key=`${cookie.path}:${cookie.name}`;
      if(cookie.expires!==null&&cookie.expires<=Date.now())cookies.delete(key);else cookies.set(key,cookie);
    }
    return response;
  }
  return {fetch:fetchResponse,async request(route,{method="GET",body,status=200}={}){
    const response=await fetchResponse(route,{method,body});
    const url=new URL(route,base);
    const data=await response.json().catch(()=>null);
    assert.equal(response.status,status,`${method} ${url.pathname}: status ${response.status}, esperado ${status}`);
    if(data&&Object.hasOwn(data,"csrfToken"))csrfToken=data.csrfToken;
    return data;
  }};
}
