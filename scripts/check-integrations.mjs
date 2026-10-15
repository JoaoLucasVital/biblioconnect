import path from "node:path";
import { fileURLToPath } from "node:url";

/** Presence/shape checks only. Never returns credentials or claims provider verification. */
export function checkIntegrations(env = {}) {
  const present = key => typeof env[key] === "string" && env[key].trim() !== "" && !/SUBSTITUA|SUA_SENHA|DEFINA_UMA/.test(env[key]);
  const service = required => ({ configured:false, verified:false, missing:required.filter(key=>!present(key)), invalid:[] });
  const services = {
    database:service(["DATABASE_URL"]),session:service(["AUTH_SECRET"]),
    googleMaps:service(["GOOGLE_MAPS_API_KEY","STORE_ADDRESS"]),
    googleLogin:service(["GOOGLE_CLIENT_ID"]),
    stripe:service(["STRIPE_SECRET_KEY","STRIPE_PUBLISHABLE_KEY","STRIPE_WEBHOOK_SECRET"]),
    email:service([]),storage:service([]),
  };
  if(present("DATABASE_URL")){
    try{
      const url=new URL(env.DATABASE_URL);
      if(!["postgres:","postgresql:"].includes(url.protocol) || !url.hostname || (env.NODE_ENV==="production" && ["localhost","127.0.0.1","::1"].includes(url.hostname)))services.database.invalid.push("DATABASE_URL");
    }catch{services.database.invalid.push("DATABASE_URL");}
  }
  if(present("AUTH_SECRET") && Buffer.byteLength(env.AUTH_SECRET)<32)services.session.invalid.push("AUTH_SECRET");
  if(present("GOOGLE_CLIENT_ID") && !env.GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com"))services.googleLogin.invalid.push("GOOGLE_CLIENT_ID");
  const secretMode=/^(?:sk|rk)_(test|live)_/.exec(env.STRIPE_SECRET_KEY??"")?.[1];
  const publicMode=/^pk_(test|live)_/.exec(env.STRIPE_PUBLISHABLE_KEY??"")?.[1];
  if(present("STRIPE_SECRET_KEY") && !secretMode)services.stripe.invalid.push("STRIPE_SECRET_KEY");
  if(present("STRIPE_PUBLISHABLE_KEY") && (!publicMode || (secretMode && secretMode!==publicMode)))services.stripe.invalid.push("STRIPE_PUBLISHABLE_KEY");
  if(present("STRIPE_WEBHOOK_SECRET") && !env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_"))services.stripe.invalid.push("STRIPE_WEBHOOK_SECRET");
  const emailProvider=env.EMAIL_PROVIDER??"gmail";
  services.email=service(emailProvider==="resend"?["RESEND_API_KEY","EMAIL_FROM"]:emailProvider==="file"?[]:["EMAIL_USER","EMAIL_PASS",...(emailProvider==="smtp"?["EMAIL_HOST"]:[])]);
  services.email.externalDelivery=emailProvider!=="file";
  if(!["gmail","smtp","resend","file"].includes(emailProvider) || (emailProvider==="file" && env.NODE_ENV==="production"))services.email.invalid.push("EMAIL_PROVIDER");
  if(env.MEDIA_STORAGE==="blob"){
    services.storage=service(["BLOB_PRIVATE_STORE_ID","BLOB_PRIVATE_WEBHOOK_PUBLIC_KEY"]);
    if(!present("VERCEL_OIDC_TOKEN")&&!present("BLOB_PRIVATE_READ_WRITE_TOKEN"))services.storage.missing.push("BLOB_PRIVATE_AUTHENTICATION");
    if(!present("BLOB_READ_WRITE_TOKEN")&&!(present("BLOB_STORE_ID")&&present("VERCEL_OIDC_TOKEN")))services.storage.missing.push("BLOB_PUBLIC_AUTHENTICATION");
  }else if(env.NODE_ENV==="production")services.storage.invalid.push("MEDIA_STORAGE");
  for(const value of Object.values(services))value.configured=value.missing.length===0&&value.invalid.length===0;
  return {services,configurationComplete:Object.values(services).every(value=>value.configured),productionReady:false,note:"Presença de configuração não comprova autenticação, entrega, pagamentos ou deploy; validar os provedores separadamente."};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {default:dotenv}=await import("dotenv");
  dotenv.config({path:[".env.local",".env"],quiet:true});
  console.log(JSON.stringify(checkIntegrations(process.env),null,2));
}
