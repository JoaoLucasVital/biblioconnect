import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const result=spawnSync(process.execPath,[fileURLToPath(new URL("../node_modules/vite/bin/vite.js",import.meta.url)),"build"],{stdio:"inherit",env:{...process.env,VITE_API_URL:"/api"}});
process.exitCode=result.status??1;
