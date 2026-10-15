import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {startQaEnvironment} from "../scripts/qa-environment.js";

test("falha de envio no cadastro não expõe diagnóstico e mantém a confirmação obrigatória",async t=>{
  const qa=await startQaEnvironment();t.after(()=>qa.stop());
  // Only the fresh, disposable QA outbox is blocked; no external email is sent.
  await fs.rmdir(qa.emailDir);await fs.writeFile(qa.emailDir,"outbox unavailable");
  const body={nome:"Leitor",email:"email-failure@example.test",senha:"Password123!",cep:"57075000",rua:"Avenida de teste",bairro:"Centro",cidade:"Maceió",estado:"AL",numero:"10"};
  const post=(path,data)=>fetch(`${qa.apiUrl}${path}`,{method:"POST",headers:{Origin:qa.apiUrl,"Content-Type":"application/json"},body:JSON.stringify(data)});
  const response=await post("/usuarios",body);assert.equal(response.status,201);
  const result=await response.json();assert.equal(result.emailEnviado,false);
  assert.equal(result.usuario.emailConfirmado,false);
  assert.doesNotMatch(result.avisoEmail,/EMAIL_|\.env|EEXIST|mkdir|\.local|outbox/i);
  assert.equal((await post("/login",{email:body.email,senha:body.senha})).status,403);
  const resend=await post("/reenviar-confirmacao",{email:body.email});assert.equal(resend.status,503);
  assert.doesNotMatch(JSON.stringify(await resend.json()),/EMAIL_|\.env|EEXIST|mkdir|\.local|outbox/i);
  // Once delivery is available again, the same account can resend and confirm.
  await fs.unlink(qa.emailDir);await fs.mkdir(qa.emailDir);
  assert.equal((await post("/reenviar-confirmacao",{email:body.email})).status,200);
  const [message]=await fs.readdir(qa.emailDir);
  const html=await fs.readFile(`${qa.emailDir}/${message}`,"utf8");
  const link=html.match(/href="([^"]*\/confirmar-email\/[^\"]+)"/)?.[1];assert.ok(link,"Deve gerar um link de confirmação");
  assert.equal((await fetch(link)).status,200);
  assert.equal((await post("/login",{email:body.email,senha:body.senha})).status,200);
});
