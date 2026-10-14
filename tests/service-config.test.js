import test from "node:test";
import assert from "node:assert/strict";

let checkIntegrations;
try { ({ checkIntegrations } = await import("../scripts/check-integrations.mjs")); }
catch (error) { if(error.code!=="ERR_MODULE_NOT_FOUND") throw error; }

test("diagnóstico identifica configurações ausentes sem revelar segredos",()=>{
  assert.equal(typeof checkIntegrations,"function","Diagnóstico de integração precisa existir");
  const result=checkIntegrations({NODE_ENV:"production",STRIPE_SECRET_KEY:"private-credential-that-must-never-appear"});
  assert.equal(result.productionReady,false);
  assert.ok(result.services.googleMaps.missing.includes("GOOGLE_MAPS_API_KEY"));
  assert.ok(result.services.googleMaps.missing.includes("STORE_ADDRESS"));
  assert.ok(!JSON.stringify(result).includes("private-credential-that-must-never-appear"));
});

test("configuração presente não é declarada como integração validada e file não é envio externo",()=>{
  assert.equal(typeof checkIntegrations,"function");
  const result=checkIntegrations({NODE_ENV:"production",EMAIL_PROVIDER:"file",GOOGLE_MAPS_API_KEY:"key-local-for-test",STORE_ADDRESS:"Biblioteca pública"});
  assert.equal(result.services.googleMaps.configured,true);
  assert.equal(result.services.googleMaps.verified,false);
  assert.equal(result.services.email.configured,false);
  assert.equal(result.services.email.externalDelivery,false);
  assert.ok(result.services.email.invalid.includes("EMAIL_PROVIDER"));
});

test("diagnóstico distingue segredos de sessão curtos e chaves Stripe de ambientes diferentes",()=>{
  assert.equal(typeof checkIntegrations,"function");
  const result=checkIntegrations({AUTH_SECRET:"short",STRIPE_SECRET_KEY:"sk_test_example",STRIPE_PUBLISHABLE_KEY:"pk_live_example",STRIPE_WEBHOOK_SECRET:"whsec_example"});
  assert.ok(result.services.session.invalid.includes("AUTH_SECRET"));
  assert.equal(result.services.stripe.configured,false);
  assert.ok(result.services.stripe.invalid.includes("STRIPE_PUBLISHABLE_KEY"));
});
