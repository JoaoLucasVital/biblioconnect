import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

let createQaClient;
try { ({createQaClient}=await import("./helpers/qaClient.js")); }
catch(error){if(error.code!=="ERR_MODULE_NOT_FOUND")throw error;}

test("cliente QA só aceita API local e não permite redirecionar credenciais a outra origem",async()=>{
  assert.equal(typeof createQaClient,"function","Cliente QA com cookies precisa existir");
  assert.throws(()=>createQaClient("https://example.com"),/local/i);
  const client=createQaClient("http://127.0.0.1:3999");
  await assert.rejects(client.request("https://example.com/login"),/local|origem/i);
});

test("cliente QA mantém cookies e CSRF independentes entre duas sessões",async t=>{
  assert.equal(typeof createQaClient,"function");
  const server=http.createServer(async(req,res)=>{
    res.setHeader("Content-Type","application/json");
    if(req.url==="/session"){
      res.setHeader("Set-Cookie",["bc_session=opaque; HttpOnly; Path=/", "nonce=local; Path=/"]);
      res.end(JSON.stringify({csrfToken:"csrf-for-test"}));
    }else{
      res.end(JSON.stringify({cookie:req.headers.cookie??null,csrf:req.headers["x-csrf-token"]??null,origin:req.headers.origin??null}));
    }
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const one=createQaClient(base),two=createQaClient(base);
  await one.request("/session");
  const own=await one.request("/change",{method:"POST",body:{ok:true}});
  const other=await two.request("/change",{method:"POST",body:{ok:true}});
  assert.match(own.cookie,/bc_session=opaque/);
  assert.equal(own.csrf,"csrf-for-test");
  assert.equal(own.origin,base);
  assert.equal(other.cookie,null);
  assert.equal(other.csrf,null);
  const raw=await one.fetch("/change",{method:"POST",body:{ok:true}});
  assert.equal(raw.status,200);assert.equal((await raw.json()).csrf,"csrf-for-test");
  await assert.rejects(one.fetch("https://example.com/write",{method:"POST"}),/origem/i);
});
