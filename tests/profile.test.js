import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import {createMediaStorage} from "../src/services/mediaStorage.js";
import {createTestDatabase} from "./helpers/database.js";
import {createAuth} from "../src/middleware/auth.js";
import {createQaClient} from "./helpers/qaClient.js";
let profiles,images,routes;
try{profiles=await import("../src/services/profileService.js");images=await import("../src/services/profileImageService.js");routes=await import("../src/routes/profileRoutes.js");}catch(error){if(error.code!=="ERR_MODULE_NOT_FOUND")throw error;}
test("perfil aceita apenas dados próprios e foto privada preserva anterior na falha",async t=>{
  assert.equal(typeof routes?.createProfileRoutes,"function");const {prisma}=await createTestDatabase(t);
  const user=await prisma.usuario.create({data:{nome:"Leitor",email:"profile@example.test",senha:"hash",emailConfirmado:true}});
  const other=await prisma.usuario.create({data:{nome:"Outro",email:"other@example.test",senha:"hash",emailConfirmado:true}});
  const files=new Map();let fail=false;
  const storage={async saveAvatar({usuarioId,bytes}){if(fail)throw new Error("storage unavailable");const key=`private-${usuarioId}-${files.size}`;files.set(key,bytes);return key;},async readAvatar({key}){return files.get(key)||null;},async deleteAvatar({key}){files.delete(key);}};
  const app=express();app.use(express.json());let auth;
  const server=app.listen(0,"127.0.0.1");await new Promise(resolve=>server.once("listening",resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;auth=createAuth({prisma,secret:"profile-test-secret-at-least-32-bytes",allowedOrigins:[base]});
  app.post("/test-login",auth.requireOrigin,async(req,res)=>auth.signIn(res,{usuarioId:req.body.other?other.id:user.id}));
  app.use(routes.createProfileRoutes({prisma,auth,storage}));
  const client=createQaClient(base),anonymous=createQaClient(base),second=createQaClient(base);await client.request("/test-login",{method:"POST",body:{}});await second.request("/test-login",{method:"POST",body:{other:true}});
  await client.request("/me",{method:"PATCH",body:{role:"ADMIN"},status:400});await client.request("/me",{method:"PATCH",body:{id:other.id,nome:"Invadido"},status:400});
  const updated=await client.request("/me",{method:"PATCH",body:{nome:"Nome editado",telefone:"82999999999",cidade:"Maceió",estado:"AL"}});assert.equal(updated.nome,"Nome editado");assert.equal(updated.role,"CLIENTE");assert.equal((await prisma.usuario.findUnique({where:{id:other.id}})).nome,"Outro");
  const upload=async(bytes,status=200)=>{
    // QA client keeps its cookie/CSRF but submits multipart without JSON coercion.
    const form=new FormData();form.append("foto",new Blob([bytes],{type:"image/webp"}),"avatar.webp");
    const response=await client.fetch("/me/foto",{method:"POST",form});assert.equal(response.status,status);return response;
  };
  const bytes=await sharp({create:{width:64,height:80,channels:4,background:{r:100,g:60,b:20,alpha:.7}}}).webp().toBuffer();
  await upload(bytes);const before=await prisma.usuario.findUnique({where:{id:user.id}});assert.ok(before.avatarKey);
  fail=true;await upload(bytes,503);assert.equal((await prisma.usuario.findUnique({where:{id:user.id}})).avatarKey,before.avatarKey);assert.ok(files.has(before.avatarKey));fail=false;
  await upload(Buffer.from("not an image"),400);await upload(Buffer.alloc(2*1024*1024+1),413);
  await anonymous.request("/me/foto",{status:401});await second.request("/me/foto",{status:404});
  const read=await client.fetch("/me/foto");assert.equal(read.status,200);assert.equal(read.headers.get("content-type"),"image/webp");assert.equal(read.headers.get("cache-control"),"private, no-store");
  await upload(bytes);assert.notEqual((await prisma.usuario.findUnique({where:{id:user.id}})).avatarKey,before.avatarKey);
  await client.request("/me/foto",{method:"DELETE"});await client.request("/me/foto",{status:404});
});
test("imagem é reencodificada sem EXIF e rejeita formatos, pixel bomb e excesso",async()=>{
  assert.equal(typeof images?.sanitizeProfileImage,"function");
  const source=await sharp({create:{width:64,height:80,channels:4,background:{r:10,g:30,b:60,alpha:.8}}}).withMetadata({exif:{IFD0:{Artist:"Private metadata"}}}).png().toBuffer();
  const output=await images.sanitizeProfileImage(source);const metadata=await sharp(output).metadata();assert.equal(metadata.format,"webp");assert.equal(metadata.exif,undefined);assert.equal(metadata.hasAlpha,true);
  await assert.rejects(images.sanitizeProfileImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')));
  await assert.rejects(images.sanitizeProfileImage(Buffer.alloc(2*1024*1024+1)));
  const large=await sharp({create:{width:3000,height:3000,channels:3,background:"white"}}).png().toBuffer();await assert.rejects(images.sanitizeProfileImage(large));
});
test("disco de fotos fica privado e modo local é recusado em produção",async t=>{
  const root=path.resolve(".local/qa");await fs.mkdir(root,{recursive:true});const directory=await fs.mkdtemp(path.join(root,"profile-storage-"));
  t.after(async()=>{const relative=path.relative(root,directory);assert.ok(relative&&!relative.startsWith("..")&&!path.isAbsolute(relative));await fs.rm(directory,{recursive:true,force:true});});
  const storage=createMediaStorage({env:{NODE_ENV:"test",MEDIA_STORAGE:"local"},localDirectory:directory});
  const key=await storage.saveAvatar({usuarioId:7,bytes:Buffer.from("test bytes")});assert.deepEqual(await storage.readAvatar({key}),Buffer.from("test bytes"));assert.equal(await storage.readAvatar({key:"../../server.js"}),null);
  await storage.deleteAvatar({key});assert.equal(await storage.readAvatar({key}),null);
  const production=createMediaStorage({env:{NODE_ENV:"production",MEDIA_STORAGE:"local"},localDirectory:directory});await assert.rejects(production.saveAvatar({usuarioId:7,bytes:Buffer.from("test")}),/persistente/);
});
