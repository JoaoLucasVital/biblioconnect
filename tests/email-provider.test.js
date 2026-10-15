import test from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import {enviarEmailHtml,emailConfigurado,verificarConfiguracaoEmail} from "../src/services/emailService.js";

test("Gmail usa senha de app normalizada e mantém o formato da mensagem sem envio externo",async t=>{
  const previous={...process.env};t.after(()=>{process.env=previous;});
  Object.assign(process.env,{NODE_ENV:"production",EMAIL_PROVIDER:"gmail",EMAIL_USER:"sender@example.test",EMAIL_PASS:"abcd efgh ijkl mnop",EMAIL_FROM:"sender@example.test"});
  const createTransport=nodemailer.createTransport;
  t.mock.method(nodemailer,"createTransport",options=>{
    assert.equal(options.host,"smtp.gmail.com");assert.equal(options.port,465);assert.equal(options.secure,true);
    assert.equal(options.auth.user,"sender@example.test");assert.equal(options.auth.pass,"abcdefghijklmnop");
    return createTransport({jsonTransport:true});
  });
  const sent=await enviarEmailHtml({to:"reader@example.test",subject:"Confirme seu email",html:"<p>Confirme sua conta.</p>"});
  const message=JSON.parse(sent.message.toString());
  assert.equal(message.from.address,"sender@example.test");assert.equal(message.to[0].address,"reader@example.test");
  assert.equal(message.subject,"Confirme seu email");assert.doesNotMatch(sent.message.toString(),/abcdefghijklmnop/);
});
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
