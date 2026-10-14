import {createHmac,timingSafeEqual} from "node:crypto";
import {createSession,resolveSession,revokeSession} from "../services/authSessionService.js";
import {consumeRateLimit} from "../services/rateLimitService.js";

const cookieName="bc_session";
const unsafe=req=>!["GET","HEAD","OPTIONS"].includes(req.method);
function readSecret(req){
  const pair=String(req.headers.cookie||"").split(";").map(value=>value.trim()).find(value=>value.startsWith(`${cookieName}=`));
  return pair?.slice(cookieName.length+1)||null;
}

export function createAuth({prisma,secret,allowedOrigins,production=false,clock=()=>new Date()}){
  if(Buffer.byteLength(secret||"")<32)throw new Error("AUTH_SECRET deve conter pelo menos 32 bytes.");
  const origins=new Set(allowedOrigins);
  const csrf=id=>createHmac("sha256",secret).update(`csrf:${id}`).digest("base64url");
  const cookieOptions={httpOnly:true,secure:production,sameSite:"lax",path:"/"};
  function setCookie(res,session){
    if(!session.secret)return;
    const maxAge=session.lembrar?Math.max(0,+session.idleExpiresAt-+clock()):undefined;
    res.cookie(cookieName,session.secret,{...cookieOptions,...(maxAge!==undefined?{maxAge}:{})});
  }
  function requireOrigin(req,res,next){
    if(!origins.has(req.headers.origin))return res.status(403).json({erro:"Origem da solicitação não permitida."});
    next();
  }
  async function load(req,res){
    if(Object.hasOwn(req,"authSession"))return req.authSession;
    res.set("Cache-Control","no-store");
    req.authSession=await resolveSession(prisma,{secret:readSecret(req),now:clock()});
    if(req.authSession){req.usuario=req.authSession.usuario;setCookie(res,req.authSession);}
    return req.authSession;
  }
  async function authenticate(req,res,next){
    try{
      const session=await load(req,res);
      if(!session)return res.status(401).json({erro:"Sua sessão expirou. Entre novamente."});
      if(unsafe(req)){
        if(!origins.has(req.headers.origin))return res.status(403).json({erro:"Origem da solicitação não permitida."});
        const received=Buffer.from(String(req.headers["x-csrf-token"]||"")),expected=Buffer.from(csrf(session.id));
        if(received.length!==expected.length||!timingSafeEqual(received,expected))return res.status(403).json({erro:"Atualize a página e tente novamente."});
      }
      next();
    }catch(error){next(error);}
  }
  async function sessionResponse(req,res,next){
    try{const session=await load(req,res);res.json({usuario:session?.usuario||null,csrfToken:session?csrf(session.id):null});}catch(error){next(error);}
  }
  async function signIn(res,{usuarioId,lembrar=false}){
    const session=await createSession(prisma,{usuarioId,lembrar:lembrar===true,now:clock()});
    res.set("Cache-Control","no-store");setCookie(res,session);
    return res.json({usuario:session.usuario,csrfToken:csrf(session.id)});
  }
  async function signOut(req,res,next){
    try{
      await revokeSession(prisma,{secret:readSecret(req),now:clock()});
      res.clearCookie(cookieName,cookieOptions);res.set("Cache-Control","no-store");res.json({mensagem:"Sessão encerrada."});
    }catch(error){next(error);}
  }
  function rateLimit(scope,{limit,windowMs,key=req=>req.ip}){
    return async(req,res,next)=>{
      try{
        const result=await consumeRateLimit(prisma,{scope,key:key(req),limit,windowMs,secret,now:clock()});
        if(!result.allowed)return res.set("Retry-After",String(result.retryAfterSeconds)).status(429).json({erro:"Muitas tentativas. Aguarde e tente novamente."});
        next();
      }catch(error){next(error);}
    };
  }
  return {authenticate,requireOrigin,sessionResponse,signIn,signOut,rateLimit};
}
