import fs from "node:fs/promises";
import net from "node:net";
import {PGlite} from "@electric-sql/pglite";
import {PGLiteSocketServer} from "@electric-sql/pglite-socket";
import {PrismaClient} from "@prisma/client";

/** Own in-memory database and a single Prisma client; never uses DATABASE_URL. */
export async function createTestDatabase(t){
  const db=await PGlite.create();
  let socket,prisma;
  t.after(async()=>{if(prisma)await prisma.$disconnect();if(socket)await socket.stop();await db.close();});
  const directory=new URL("../../prisma/migrations/",import.meta.url);
  for(const name of (await fs.readdir(directory)).filter(name=>/^\d/.test(name)).sort())await db.transaction(async tx=>tx.exec(await fs.readFile(new URL(`${name}/migration.sql`,directory),"utf8")));
  const probe=net.createServer();
  await new Promise((resolve,reject)=>{probe.once("error",reject);probe.listen(0,"127.0.0.1",resolve);});
  const port=probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  socket=new PGLiteSocketServer({db,host:"127.0.0.1",port});await socket.start();
  prisma=new PrismaClient({datasourceUrl:`postgresql://postgres:postgres@127.0.0.1:${port}/postgres?connection_limit=1`});
  await prisma.$connect();
  return {prisma,db};
}
