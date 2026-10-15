// Provider credentials belong to Vercel environment variables, never this file.
export const config={
  services:{
    frontend:{root:"frontend",framework:"vite",buildCommand:"npm run build:hosted",outputDirectory:"dist",rewrites:[{source:"/(.*)",destination:"/index.html"}]},
    backend:{root:".",framework:"express",entrypoint:"src/app.js",buildCommand:"npm run prisma:generate"},
  },
  rewrites:[
    {source:"/api",destination:{service:"backend"}},
    {source:"/api/(.*)",destination:{service:"backend"}},
    {source:"/(.*)",destination:{service:"frontend"}},
  ],
  headers:[{source:"/(.*)",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"X-Frame-Options",value:"DENY"}]}],
  crons:[{path:"/api/internal/cron",schedule:"0 6 * * *"}],
};
