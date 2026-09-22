import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode})=>{
 Object.assign(process.env,loadEnv(mode,process.cwd(),''));
 return {plugins:[react(),{name:'local-api',configureServer(server){
  server.middlewares.use((req,_res,next)=>{if(req.url==='/admin')req.url='/admin.html';next()});
  server.middlewares.use('/api',async(req,res,next)=>{
   try{
    const {GET}=await server.ssrLoadModule('/app/api/route.ts');
    const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));
    const r=await GET(new Request('http://'+req.headers.host+'/api'+req.url,{
     method:req.method,headers:req.headers as Record<string,string>,
     body:['GET','HEAD'].includes(req.method||'GET')?undefined:Buffer.concat(chunks)
    }));
    res.statusCode=r.status;r.headers.forEach((v:string,k:string)=>res.setHeader(k,v));
    res.end(Buffer.from(await r.arrayBuffer()));
   }catch(e){next(e)}
  });
 }}],build:{rollupOptions:{input:{main:'index.html',admin:'admin.html'}}}};
});
