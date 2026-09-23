import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {newDb} from 'pg-mem';
process.env.NODE_ENV='test';
const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
const pg=newDb().adapters.createPg(),pool=new pg.Pool();
try{
 const {readApiResponse}=await vite.ssrLoadModule('/app/api-response.ts');
 await assert.rejects(()=>readApiResponse(new Response('A server error has occurred',{status:500})),/studio server is temporarily unavailable/);
 await assert.rejects(()=>readApiResponse(Response.json({error:'Incorrect username or password.'},{status:401})),/Incorrect username or password/);
 const {setTestDatabase}=await vite.ssrLoadModule('/app/database.ts');setTestDatabase((sql,values)=>pool.query(sql,values));
 const {passwordHash}=await vite.ssrLoadModule('/app/server.ts');process.env.ADMIN_USERNAME='test-admin';process.env.ADMIN_PASSWORD_HASH=await passwordHash('integration-test-password');
 const {GET}=await vite.ssrLoadModule('/app/api/route.ts');let cookie='';
 async function api(path,method='GET',data,auth=true){const r=await GET(new Request('https://portfolio.test/api/'+path,{method,headers:{Origin:'https://portfolio.test','x-studio-request':'1','Content-Type':'application/json',...(auth?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined}));return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')}}
 assert.equal((await api('youtube-connection')).status,401);
 const initial=await api('content');assert.equal(initial.status,200);assert.equal(initial.data.videos.length,24);
 const login=await api('login','POST',{username:'test-admin',password:'integration-test-password'});assert.equal(login.status,200);cookie=login.cookie.split(';')[0];assert.match(login.cookie,/HttpOnly/);assert.match(login.cookie,/Secure/);
 assert.equal((await api('session')).data.authenticated,true);
 const video={...initial.data.videos[0],title:'Edited title',brandIntegrated:true,brandName:'CeraVe',brandLogo:''};assert.equal((await api('videos','PUT',video)).status,200);
 const updated=(await api('content')).data.videos.find(v=>v.id===video.id);assert.equal(updated.title,'Edited title');assert.equal(updated.brandLogo,'/brands/cerave.svg');
 const noCsrf=await GET(new Request('https://portfolio.test/api/settings',{method:'PUT',headers:{Cookie:cookie},body:'{}'}));assert.equal(noCsrf.status,403);
 const actualFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({items:[{id:'NEWVIDEO123',statistics:{viewCount:'12345'}}]});
 process.env.YOUTUBE_API_KEY='test-official-key';
 const added=await api('videos','POST',{...video,url:'https://youtu.be/NEWVIDEO123',views:999999999});assert.equal(added.status,200);assert.equal(added.data.viewsRefreshed,true);
 assert.equal((await api('content')).data.videos.find(v=>v.id==='NEWVIDEO123').views,12345);
 globalThis.fetch=actualFetch;
 assert.equal((await api('videos','POST',{...video,url:'https://youtu.be/NEWVIDEO123'})).status,409);
 assert.equal((await api('videos/NEWVIDEO123','DELETE')).status,200);
 assert.equal((await api('youtube-connection')).data.connected,true);
 const text=JSON.stringify((await api('content')).data);assert.ok(!text.includes('test-official-key'));assert.ok(!text.includes('integration-test-password'));
 const {db,media}=await vite.ssrLoadModule('/app/database.ts');await media.put('test-media',new Uint8Array([1,2,3]),{httpMetadata:{contentType:'image/png'}});assert.deepEqual(Array.from((await media.get('test-media')).body),[1,2,3]);
 await api('logout','POST',{});assert.equal((await api('session')).data.authenticated,false);
 console.log('PASS: migration, private auth, CSRF, persistent edits, automatic brand logo, instant official views, forged-count rejection, duplicates, media persistence, key privacy, logout.');
}finally{await pool.end();await vite.close()}
