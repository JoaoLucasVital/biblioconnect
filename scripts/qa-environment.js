import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import net from "node:net";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const qaRoot = path.join(root, ".local", "qa");

function safeQaPath(value) {
  const absolute = path.resolve(value);
  const relative = path.relative(qaRoot, absolute);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("O caminho precisa pertencer a um diretório QA próprio dentro de .local/qa.");
  }
  return absolute;
}

/** As variáveis explícitas impedem que testes usem banco ou integrações reais herdados. */
export function buildQaEnv({ apiPort, frontendPort, databasePort, emailDir, jwtSecret }) {
  for (const port of [apiPort, frontendPort, databasePort]) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Porta QA inválida.");
  }
  if (new Set([apiPort, frontendPort, databasePort]).size !== 3) throw new Error("As portas QA precisam ser distintas.");
  return {
    ...process.env,
    NODE_ENV: "development",
    PORT: String(apiPort),
    BACKEND_URL: `http://127.0.0.1:${apiPort}`,
    FRONTEND_URL: `http://127.0.0.1:${frontendPort}`,
    DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${databasePort}/postgres?connection_limit=1`,
    JWT_SECRET: jwtSecret,
    ADMIN_EMAIL: "admin@biblioconnect.com",
    ADMIN_PASSWORD: "admin123",
    EMAIL_PROVIDER: "file",
    EMAIL_OUTPUT_DIR: safeQaPath(emailDir),
    EMAIL_USER: "", EMAIL_PASS: "", EMAIL_HOST: "",
    MERCADO_PAGO_ACCESS_TOKEN: "", MERCADO_PAGO_WEBHOOK_SECRET: "",
    GOOGLE_MAPS_API_KEY: "", GOOGLE_BOOKS_API_KEY: "",
    ALLOW_PAYMENT_SIMULATION: "true",
    DISABLE_DELAY_EMAIL_JOB: "true",
  };
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise(resolve => {
    const timeout = setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 3000);
    child.once("exit", () => { clearTimeout(timeout); resolve(); });
    child.kill("SIGTERM");
  });
}

async function waitForHttp(url, processInfo) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (processInfo.child.exitCode !== null) throw new Error(`Serviço QA encerrou: ${processInfo.log}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      await response.arrayBuffer();
      if (response.ok) return;
    } catch { /* aguarda somente durante a inicialização dos processos próprios */ }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`Timeout de inicialização QA em ${url}: ${processInfo.log}`);
}

async function createEnvironment(withFrontend) {
  await fs.mkdir(qaRoot, { recursive: true });
  const directory = safeQaPath(await fs.mkdtemp(path.join(qaRoot, "run-")));
  const children = [];
  let db;
  let socket;
  let stopping;
  const stop = () => stopping ??= (async () => {
    await Promise.all(children.map(info => stopChild(info.child)));
    if (socket) await socket.stop();
    if (db) await db.close();
    // Valida novamente o destino absoluto imediatamente antes da remoção.
    await fs.rm(safeQaPath(directory), { recursive: true, force: true });
  })();
  const startChild = (args, cwd, env) => {
    const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const info = { child, log: "" };
    const collect = data => { info.log = (info.log + data.toString()).slice(-5000); };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("error", error => { info.log += error.message; });
    children.push(info);
    return info;
  };
  try {
    const [{ PGlite }, { PGLiteSocketServer }] = await Promise.all([
      import("@electric-sql/pglite"), import("@electric-sql/pglite-socket"),
    ]);
    const ports = new Set();
    while (ports.size < 3) ports.add(await freePort());
    const [apiPort, frontendPort, databasePort] = [...ports];
    const emailDir = safeQaPath(path.join(directory, "emails"));
    await fs.mkdir(emailDir);
    const env = buildQaEnv({ apiPort, frontendPort, databasePort, emailDir, jwtSecret: crypto.randomBytes(32).toString("hex") });
    db = await PGlite.create(path.join(directory, "database"));
    const migrationsPath = path.join(root, "prisma", "migrations");
    const migrations = (await fs.readdir(migrationsPath, { withFileTypes: true })).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of migrations) {
      const sql = await fs.readFile(path.join(migrationsPath, entry.name, "migration.sql"), "utf8");
      await db.transaction(transaction => transaction.exec(sql));
    }
    socket = new PGLiteSocketServer({ db, host: "127.0.0.1", port: databasePort });
    await socket.start();
    const backend = startChild(["server.js"], root, env);
    await waitForHttp(`${env.BACKEND_URL}/livros`, backend);
    let frontendUrl = null;
    if (withFrontend) {
      frontendUrl = env.FRONTEND_URL;
      const frontend = startChild(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(frontendPort), "--strictPort"],
        path.join(root, "frontend"), { ...env, VITE_API_URL: env.BACKEND_URL });
      await waitForHttp(frontendUrl, frontend);
    }
    return { apiUrl: env.BACKEND_URL, frontendUrl, databaseUrl: env.DATABASE_URL, emailDir, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}

export async function startQaEnvironment({ withFrontend = false } = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await createEnvironment(withFrontend); }
    catch (error) { if (attempt === 3 || !/EADDRINUSE/.test(error.message)) throw error; }
  }
}

async function runCli() {
  const mode = process.argv[2];
  if (!["--integration", "--e2e", "--serve"].includes(mode)) throw new Error("Use --integration, --e2e ou --serve.");
  const qa = await startQaEnvironment({ withFrontend: mode !== "--integration" });
  let runner;
  const stop = async () => { if (runner) await stopChild(runner); await qa.stop(); };
  const handleSignal = () => { stop().finally(() => { process.exitCode = 130; }); };
  process.once("SIGINT", handleSignal);
  process.once("SIGTERM", handleSignal);
  try {
    console.log(`QA isolado: API ${qa.apiUrl}${qa.frontendUrl ? ` | Frontend ${qa.frontendUrl}` : ""}`);
    if (mode === "--serve") {
      console.log(`E-mails locais: ${qa.emailDir}`);
      await new Promise(resolve => { process.once("SIGINT", resolve); process.once("SIGTERM", resolve); });
      return;
    }
    const args = mode === "--integration" ? ["--test", "tests/**/*.test.js"] : ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(3)];
    runner = spawn(process.execPath, args, {
      cwd: mode === "--integration" ? root : path.join(root, "frontend"), windowsHide: true, stdio: "inherit",
      env: { ...process.env, API_TEST_URL: qa.apiUrl, QA_API_URL: qa.apiUrl, QA_BASE_URL: qa.frontendUrl ?? "",
        EMAIL_OUTPUT_DIR: qa.emailDir, DATABASE_URL: qa.databaseUrl },
    });
    process.exitCode = await new Promise((resolve, reject) => { runner.once("exit", code => resolve(code ?? 1)); runner.once("error", reject); });
  } finally {
    process.removeListener("SIGINT", handleSignal);
    process.removeListener("SIGTERM", handleSignal);
    await stop();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch(error => { console.error(error.message); process.exitCode = 1; });
}
