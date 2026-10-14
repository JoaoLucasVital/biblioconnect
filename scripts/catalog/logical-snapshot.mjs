import net from 'node:net';
import assert from 'node:assert/strict';

// Small PostgreSQL simple-query reader for the local PGlite socket. No prepared
// statements: independent Prisma clients share statement names in that runtime.
export async function logicalSnapshot(databaseUrl){
  const url=new URL(databaseUrl);
  assert.ok(['127.0.0.1','localhost'].includes(url.hostname),'Snapshot restricted to local runtime');
  const socket=net.createConnection({host:url.hostname,port:Number(url.port)||5432});
  let buffer=Buffer.alloc(0),pending;
  socket.setTimeout(15000,()=>socket.destroy(new Error('PostgreSQL snapshot timed out')));
  socket.on('error',error=>pending?.reject(error));
  socket.on('data',chunk=>{
    buffer=Buffer.concat([buffer,chunk]);
    while(buffer.length>=5){
      const length=buffer.readInt32BE(1);if(buffer.length<length+1)break;
      const type=String.fromCharCode(buffer[0]),body=buffer.subarray(5,length+1);buffer=buffer.subarray(length+1);
      if(type==='R' && body.readInt32BE(0)!==0)pending.error=new Error('Local socket unexpectedly requires authentication');
      if(type==='E')pending.error=new Error(body.toString().replaceAll('\0',' '));
      if(type==='D'){
        const fields=[];let offset=2;
        for(let i=0;i<body.readInt16BE(0);i++){
          const size=body.readInt32BE(offset);offset+=4;
          fields.push(size===-1?null:body.toString('utf8',offset,offset+size));if(size>=0)offset+=size;
        }
        pending.rows.push(fields);
      }
      if(type==='Z'){
        const result=pending;pending=undefined;
        result.error?result.reject(result.error):result.resolve(result.rows);
      }
    }
  });
  const wait=()=>new Promise((resolve,reject)=>{assert.equal(pending,undefined);pending={resolve,reject,rows:[]}});
  const query=async(sql)=>{
    const done=wait(),body=Buffer.from(`${sql}\0`),header=Buffer.alloc(5);
    header[0]=81;header.writeInt32BE(body.length+4,1);socket.write(Buffer.concat([header,body]));return done;
  };
  try{
    const ready=wait();
    const parameters=Buffer.from(`user\0${decodeURIComponent(url.username)}\0database\0${url.pathname.slice(1)}\0client_encoding\0UTF8\0\0`);
    const header=Buffer.alloc(8);header.writeInt32BE(parameters.length+8);header.writeInt32BE(196608,4);
    socket.write(Buffer.concat([header,parameters]));await ready;
    await query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const tables=await query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    const data={};
    for(const [table] of tables){
      const escaped=table.replaceAll('"','""');
      const [[records]]=await query(`SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text), '[]'::jsonb) FROM "${escaped}" t`);
      data[table]=JSON.parse(records);
    }
    await query('COMMIT');return data;
  }finally{socket.end(Buffer.from([88,0,0,0,4]));socket.destroy()}
}
