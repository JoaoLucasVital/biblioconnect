import express from "express";
import backend from "../server.js";
// Importing this entrypoint configures routes only. Vercel owns the listener.
const app=express();
// Services preserves the public path. Express removes /api before existing routes.
app.use("/api",backend);
app.use(backend);
export default app;
