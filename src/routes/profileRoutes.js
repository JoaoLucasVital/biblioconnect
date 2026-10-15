import {Router} from "express";
import multer from "multer";
import {sanitizeProfileImage} from "../services/profileImageService.js";
import {createMediaStorage} from "../services/mediaStorage.js";
import {updateProfile,profileSelect,presentProfile} from "../services/profileService.js";
import {claimWelcome} from "../services/welcomeService.js";
export function createProfileRoutes({prisma,auth,storage=createMediaStorage()}){
  const router=Router(),upload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024,files:1,fields:0}}).single("foto");
  router.post("/me/welcome/claim",auth.authenticate,async(req,res,next)=>{try{res.json(await claimWelcome(prisma,req.usuario.id));}catch(error){next(error);}});
  router.get("/me",auth.authenticate,async(req,res,next)=>{try{const user=await prisma.usuario.findUnique({where:{id:req.usuario.id},select:profileSelect});res.json(presentProfile(user));}catch(error){next(error);}});
  router.patch("/me",auth.authenticate,async(req,res,next)=>{try{res.json(await updateProfile(prisma,{usuarioId:req.usuario.id,data:req.body}));}catch(error){if(error.status)return res.status(error.status).json({erro:error.message});next(error);}});
  router.get("/me/foto",auth.authenticate,async(req,res)=>{
    try{
      const user=await prisma.usuario.findUnique({where:{id:req.usuario.id},select:{avatarKey:true}}),bytes=user?.avatarKey?await storage.readAvatar({key:user.avatarKey}):null;
      if(!bytes)return res.status(404).json({erro:"Foto não encontrada."});
      res.set({"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Type":"image/webp"}).send(bytes);
    }catch{res.status(503).json({erro:"Não foi possível carregar a foto."});}
  });
  router.post("/me/foto",auth.authenticate,auth.rateLimit("profile-photo",{limit:15,windowMs:900000,key:req=>req.usuario.id}),(req,res,next)=>upload(req,res,error=>{
    if(error)return res.status(error.code==="LIMIT_FILE_SIZE"?413:400).json({erro:"Envie uma única foto processada de até 2 MB."});next();
  }),async(req,res)=>{
    let key;
    try{
      const bytes=await sanitizeProfileImage(req.file?.buffer);key=await storage.saveAvatar({usuarioId:req.usuario.id,bytes});
      const previous=await prisma.usuario.findUnique({where:{id:req.usuario.id},select:{avatarKey:true}});
      const user=await prisma.usuario.update({where:{id:req.usuario.id},data:{avatarKey:key},select:profileSelect});
      if(previous.avatarKey)await storage.deleteAvatar({key:previous.avatarKey}).catch(()=>{});
      return res.json(presentProfile(user));
    }catch(error){if(key)await storage.deleteAvatar({key}).catch(()=>{});res.status(error.status||503).json({erro:error.status?error.message:"Não foi possível salvar a foto. Sua foto anterior foi preservada."});}
  });
  router.delete("/me/foto",auth.authenticate,async(req,res)=>{
    try{
      const old=await prisma.usuario.findUnique({where:{id:req.usuario.id},select:{avatarKey:true}});
      const user=await prisma.usuario.update({where:{id:req.usuario.id},data:{avatarKey:null},select:profileSelect});
      if(old.avatarKey)await storage.deleteAvatar({key:old.avatarKey}).catch(()=>{});
      res.json(presentProfile(user));
    }catch{res.status(503).json({erro:"Não foi possível remover a foto."});}
  });
  return router;
}
