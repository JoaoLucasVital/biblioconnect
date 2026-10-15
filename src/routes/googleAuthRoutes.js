import {Router} from "express";
import {randomBytes,createHash} from "node:crypto";
import {googleAuthConfigured,verifyGoogleCredential,resolveGoogleIdentity} from "../services/googleIdentityService.js";
const hash=value=>createHash("sha256").update(value).digest("hex");
const opaque=()=>randomBytes(32).toString("base64url");
const valid=value=>typeof value==="string"&&/^[A-Za-z0-9_-]{43}$/.test(value);
export function createGoogleAuthRoutes({prisma,auth,clientId=process.env.GOOGLE_CLIENT_ID,enabled=googleAuthConfigured(clientId),production=process.env.NODE_ENV==="production",verify=verifyGoogleCredential,sendConfirmation,clock=()=>new Date()}){
  const router=Router(),cookieName="bc_google";
  const cookieOptions=req=>({httpOnly:true,secure:production,sameSite:"lax",path:`${req.baseUrl}/auth/google`,maxAge:600000});
  router.get("/auth/config",(req,res)=>res.set("Cache-Control","no-store").json({googleClientId:enabled?clientId:null,googleEnabled:enabled}));
  const configured=(req,res,next)=>enabled?next():res.status(503).json({erro:"Login Google ainda não configurado."});
  router.post("/auth/google/challenge",auth.requireOrigin,configured,auth.rateLimit("google-challenge-ip",{limit:20,windowMs:900000}),async(req,res,next)=>{
    try{
      const nonce=opaque(),cookie=opaque(),now=clock();
      const challenge=await prisma.desafioGoogle.create({data:{nonceHash:hash(nonce),cookieHash:hash(cookie),lembrar:req.body?.lembrar===true,createdAt:now,expiresAt:new Date(+now+600000)}});
      res.cookie(cookieName,cookie,cookieOptions(req)).set("Cache-Control","no-store").json({challengeId:challenge.id,nonce});
    }catch(error){next(error);}
  });
  async function complete(req,res,next){
    try{
      const {credential,challengeId,nonce}=req.body||{};
      const cookie=String(req.headers.cookie||"").split(";").map(value=>value.trim()).find(value=>value.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
      if(typeof challengeId!=="string"||challengeId.length>100||!valid(nonce)||!valid(cookie))return res.status(401).json({erro:"Solicite uma nova tentativa de login Google."});
      const now=clock(),challenge=await prisma.desafioGoogle.findUnique({where:{id:challengeId}});
      if(!challenge||challenge.consumedAt||+challenge.expiresAt<=+now||challenge.nonceHash!==hash(nonce)||challenge.cookieHash!==hash(cookie))return res.status(401).json({erro:"Solicite uma nova tentativa de login Google."});
      const claims=await verify(credential,{clientId,nonce,now});
      const consumed=await prisma.desafioGoogle.updateMany({where:{id:challenge.id,consumedAt:null,expiresAt:{gt:now}},data:{consumedAt:now}});
      if(consumed.count!==1)return res.status(401).json({erro:"Esta tentativa já foi utilizada."});
      const {maxAge,...clearOptions}=cookieOptions(req);
      res.clearCookie(cookieName,clearOptions);
      const result=await resolveGoogleIdentity(prisma,{claims,authenticatedUserId:req.usuario?.id});
      if(result.needsAccountLink)return res.status(409).json({erro:"Entre na sua conta existente para vincular o Google pelo perfil.",needsAccountLink:true});
      if(result.needsEmailConfirmation){
        if(sendConfirmation)await sendConfirmation(result.usuario);
        return res.status(403).json({erro:"Confirme o endereço de email para liberar o acesso.",precisaConfirmarEmail:true});
      }
      return await auth.signIn(res,{usuarioId:result.usuario.id,lembrar:challenge.lembrar});
    }catch(error){if(error.status)return res.status(error.status).json({erro:error.message});next(error);}
  }
  router.post("/auth/google",auth.requireOrigin,configured,auth.rateLimit("google-login-ip",{limit:20,windowMs:900000}),complete);
  router.post("/auth/google/link",configured,auth.authenticate,complete);
  return router;
}
