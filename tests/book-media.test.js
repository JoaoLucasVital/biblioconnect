import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createBookMediaService,sanitizeBookCover} from '../src/services/bookMediaService.js';

const secret='book-upload-test-secret-longer-than-32-bytes';
test('direct upload is scoped to one administrator, pathname, size and short expiry',async()=>{
  let delegated;
  const sdk={issueSignedToken:async options=>{delegated=options;return {signed:true};}};
  const service=createBookMediaService({env:{AUTH_SECRET:secret,MEDIA_STORAGE:'blob',BLOB_PRIVATE_STORE_ID:'private'},sdk});
  const ticket=service.prepare(7);
  await assert.rejects(service.authorize(8,ticket.pathname,ticket.ticket),/upload/i);
  await assert.rejects(service.authorize(7,ticket.pathname+'/other',ticket.ticket),/upload/i);
  await service.authorize(7,ticket.pathname,ticket.ticket);
  assert.equal(delegated.maximumSizeInBytes,5*1024*1024);
  assert.deepEqual(delegated.operations,['put']);assert.equal(delegated.pathname,ticket.pathname);
  assert.ok(delegated.validUntil<=Date.now()+10*60000);
});

test('finalization decodes content before public upload and never trusts client URL',async()=>{
  const valid=await sharp({create:{width:400,height:600,channels:3,background:'red'}}).withMetadata().png().toBuffer();
  let bytes=valid,published=0,deleted=0;
  const sdk={get:async()=>({statusCode:200,stream:new Blob([bytes]).stream()}),put:async(key,output,options)=>{
    published++;assert.match(key,/^livros\/7\//);assert.equal(options.access,'public');
    const meta=await sharp(output).metadata();assert.equal(meta.format,'webp');assert.equal(meta.exif,undefined);
    return {url:'https://covers.example/book.webp'};
  },del:async()=>{deleted++;}};
  const service=createBookMediaService({env:{AUTH_SECRET:secret,MEDIA_STORAGE:'blob'},sdk});
  const {ticket}=service.prepare(7);
  await assert.rejects(service.finalize(8,ticket));assert.equal(published,0);assert.equal(deleted,0);
  bytes=Buffer.from('<svg>unsafe</svg>');await assert.rejects(service.finalize(7,ticket));assert.equal(published,0);
  bytes=valid;assert.equal((await service.finalize(7,ticket)).imagemUrl,'https://covers.example/book.webp');assert.equal(published,1);assert.equal(deleted,2);
});

test('cover allows >4.5 MB input up to 5 MB, rejects excessive pixels and animated or malformed data',async()=>{
  const image=await sharp({create:{width:800,height:1200,channels:3,background:'navy'}}).jpeg().toBuffer();
  const input=Buffer.concat([image,Buffer.alloc(4.6*1024*1024)]);
  assert.ok(input.length>4.5*1024*1024);assert.equal((await sharp(await sanitizeBookCover(input)).metadata()).format,'webp');
  await assert.rejects(sanitizeBookCover(Buffer.alloc(5*1024*1024+1)));
  const huge=await sharp({create:{width:6000,height:5000,channels:3,background:'white'}}).png().toBuffer();await assert.rejects(sanitizeBookCover(huge));
});

test('cleanup only removes expired staging uploads, preserving portraits and recent files',async()=>{
  const deleted=[],old=new Date(Date.now()-2*3600000),recent=new Date();
  const prefix='book-staging/1/00000000-0000-0000-0000-000000000000';
  const service=createBookMediaService({env:{MEDIA_STORAGE:'blob'},sdk:{list:async()=>({blobs:[{pathname:prefix,uploadedAt:old},{pathname:'avatars/1/photo.webp',uploadedAt:old},{pathname:prefix+'a',uploadedAt:old},{pathname:prefix.replace('/1/','/2/'),uploadedAt:recent}]}),del:async paths=>deleted.push(...paths)}});
  assert.equal(await service.cleanupStaged(),1);assert.deepEqual(deleted,[prefix]);
});
