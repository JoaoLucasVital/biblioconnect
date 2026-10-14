import test from "node:test";
import assert from "node:assert/strict";
import {enviarEmailHtml,emailConfigurado,verificarConfiguracaoEmail} from "../src/services/emailService.js";
test("file em produção nunca é considerado envio real mesmo com credenciais herdadas",async t=>{
  const previous={...process.env};t.after(()=>{process.env=previous;});
  Object.assign(process.env,{NODE_ENV:"production",EMAIL_PROVIDER:"file",EMAIL_USER:"inherited",EMAIL_PASS:"inherited"});
  assert.equal(emailConfigurado(),false);assert.equal((await verificarConfiguracaoEmail()).ok,false);await assert.rejects(enviarEmailHtml({to:"self@example.test",subject:"test",html:"test"}));
});
test("Resend distingue ausência de configuração, rejeição e aceitação sem declarar recebimento",async t=>{
  const previous={...process.env},originalFetch=globalThis.fetch;t.after(()=>{process.env=previous;globalThis.fetch=originalFetch;});
  Object.assign(process.env,{NODE_ENV:"production",EMAIL_PROVIDER:"resend",RESEND_API_KEY:"",EMAIL_FROM:"biblioteca@example.test"});assert.equal(emailConfigurado(),false);
  await assert.rejects(enviarEmailHtml({to:"self@example.test",subject:"test",html:"test"}));
  process.env.RESEND_API_KEY="local-unit-key";assert.equal(emailConfigurado(),true);
  globalThis.fetch=async()=>new Response(JSON.stringify({message:"secret provider detail"}),{status:401});
  await assert.rejects(enviarEmailHtml({to:"self@example.test",subject:"test",html:"test"}),error=>!error.message.includes("secret provider detail"));
  globalThis.fetch=async(url,options)=>{assert.equal(url,"https://api.resend.com/emails");assert.equal(options.headers.Authorization,"Bearer local-unit-key");assert.equal(JSON.parse(options.body).to,"self@example.test");return new Response(JSON.stringify({id:"email-unit-id"}),{status:200});};
  const sent=await enviarEmailHtml({to:"self@example.test",subject:"test",html:"test"});assert.equal(sent.messageId,"email-unit-id");assert.equal(sent.delivered,false);
});
