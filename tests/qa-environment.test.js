import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

let buildQaEnv;
try {
  ({ buildQaEnv } = await import("../scripts/qa-environment.js"));
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

const options = {
  apiPort: 3001,
  frontendPort: 3377,
  databasePort: 55441,
  emailDir: path.resolve(".local/qa/test/emails"),
  jwtSecret: "qa-secret-with-at-least-32-characters",
};

test("QA neutraliza destinos e credenciais herdados antes de iniciar a API", () => {
  const overrides = {
    DATABASE_URL: "postgresql://forbidden.example/live",
    FRONTEND_URL: "https://forbidden.example",
    EMAIL_PROVIDER: "smtp",
    EMAIL_PASS: "foreign-secret",
    AVATAR_STORAGE_DIR: path.resolve(".local/persistent-avatars"),
    BOOK_UPLOAD_DIR:path.resolve(".local/persistent-books"),
    MERCADO_PAGO_ACCESS_TOKEN: "foreign-payment-key",
    STRIPE_SECRET_KEY: "foreign-stripe-key", STRIPE_PUBLISHABLE_KEY: "foreign-publishable",
    STRIPE_WEBHOOK_SECRET: "foreign-webhook", GOOGLE_CLIENT_ID: "foreign-oauth-client",
    GOOGLE_CLIENT_SECRET: "foreign-oauth-secret", RESEND_API_KEY: "foreign-email-key",
    BLOB_READ_WRITE_TOKEN: "foreign-blob-key", BLOB_STORE_ID: "foreign-store", VERCEL_OIDC_TOKEN: "foreign-oidc",
  };
  const previous = Object.fromEntries(Object.keys(overrides).map(key => [key, process.env[key]]));
  Object.assign(process.env, overrides);
  try {
    const env = buildQaEnv?.(options) ?? {};
    assert.ok(env.DATABASE_URL, "QA precisa construir uma conexão própria, sem herdar o banco existente");
    assert.equal(new URL(env.DATABASE_URL).hostname, "127.0.0.1");
    assert.equal(new URL(env.DATABASE_URL).port, "55441");
    assert.equal(env.BACKEND_URL, "http://127.0.0.1:3001");
    assert.equal(env.FRONTEND_URL, "http://127.0.0.1:3377");
    assert.equal(env.EMAIL_PROVIDER, "file");
    assert.equal(env.EMAIL_OUTPUT_DIR, options.emailDir);
    assert.equal(env.AVATAR_STORAGE_DIR,path.join(path.dirname(options.emailDir),"avatars"));
    assert.equal(env.BOOK_UPLOAD_DIR,path.join(path.dirname(options.emailDir),"book-uploads"));
    assert.notEqual(env.CRON_SECRET,env.AUTH_SECRET);
    assert.equal(env.EMAIL_PASS, "");
    assert.equal(env.MERCADO_PAGO_ACCESS_TOKEN, "");
    assert.equal(env.GOOGLE_MAPS_API_KEY, "");
    assert.equal(env.DISABLE_DELAY_EMAIL_JOB, "true");
    for (const key of ["STRIPE_SECRET_KEY","STRIPE_PUBLISHABLE_KEY","STRIPE_WEBHOOK_SECRET","GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","RESEND_API_KEY","BLOB_READ_WRITE_TOKEN","BLOB_STORE_ID","VERCEL_OIDC_TOKEN"]) assert.equal(env[key],"",`${key} precisa ser isolada`);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("QA recusa saída de e-mail dentro do banco persistente", () => {
  assert.throws(() => buildQaEnv?.({ ...options, emailDir: path.resolve(".local/database/emails") }), /diretório QA/i);
});

test("QA recusa portas inválidas em vez de construir um destino inseguro", () => {
  assert.throws(() => buildQaEnv?.({ ...options, databasePort: 0 }), /porta/i);
});
