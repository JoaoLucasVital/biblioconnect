import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import express from "express";
import {createCronRoutes} from "../src/routes/cronRoutes.js";
import {config} from "../vercel.ts";

test("importing exported app never opens a socket, connects a database or schedules jobs",()=>{
  const script=`import net from 'node:net';let listens=0,timers=0;net.Server.prototype.listen=function(){listens++;throw Error('listen during import');};globalThis.setInterval=()=>{timers++;throw Error('interval during import');};globalThis.setTimeout=()=>{timers++;throw Error('timeout during import');};const {default:app}=await import('./src/app.js');console.log(JSON.stringify({listens,timers,express:typeof app==='function'}));`;
  const child=spawnSync(process.execPath,["--input-type=module","-e",script],{cwd:process.cwd(),env:{...process.env,AUTH_SECRET:"deployment-test-secret-longer-than-32-bytes",DATABASE_URL:"postgresql://none:none@127.0.0.1:1/none",VERCEL:"1"},encoding:"utf8",timeout:15000});
  assert.equal(child.status,0,child.stderr);const result=JSON.parse(child.stdout.trim().split("\n").at(-1));
  assert.deepEqual(result,{listens:0,timers:0,express:true});
});
test("cron requires its own secret and never accepts user session as authorization",async t=>{
  let calls=0;const app=express();app.use(createCronRoutes({run:async()=>{calls++;return {cleaned:0};},secret:"cron-only-secret-longer-than-thirty-two-bytes"}));
  const server=app.listen(0,"127.0.0.1");t.after(()=>server.close());await new Promise(resolve=>server.once("listening",resolve));
  const url=`http://127.0.0.1:${server.address().port}/internal/cron`;
  assert.equal((await fetch(url)).status,401);
  assert.equal((await fetch(url,{headers:{Authorization:"Bearer random-user-session"}})).status,401);assert.equal(calls,0);
  const response=await fetch(url,{headers:{Authorization:"Bearer cron-only-secret-longer-than-thirty-two-bytes"}});assert.equal(response.status,200);assert.equal(calls,1);
  assert.equal(response.headers.get("cache-control"),"no-store");
});
test("service routing sends API to Express and keeps SPA routes inside frontend",()=>{
  assert.equal(config.services.backend.entrypoint,"src/app.js");assert.equal(config.services.frontend.root,"frontend");
  const route=pathname=>config.rewrites.find(rule=>new RegExp(`^${rule.source}$`).test(pathname))?.destination.service;
  assert.equal(route("/api/livros"),"backend");assert.equal(route("/api"),"backend");assert.equal(route("/perfil"),"frontend");
  assert.deepEqual(config.services.frontend.rewrites,[{source:"/(.*)",destination:"/index.html"}]);
  assert.equal(config.crons[0].path,"/api/internal/cron");
});
