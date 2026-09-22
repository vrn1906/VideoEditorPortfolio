import {youtubeKey,officialYoutubeViews} from './youtube-statistics';
import {database,seed} from './server';
import type {Video} from './seed';
import verifiedViews from './verified-views.json';
export function jsonObjectAt(text:string,start:number):unknown {
 if(start<0||text[start]!=='{')return null;let depth=0,inString=false,escaped=false;
 for(let i=start;i<text.length;i++){const c=text[i];if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;}else if(c==='"')inString=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){try{return JSON.parse(text.slice(start,i+1))}catch{return null}}}return null;
}
export function youtubeViews(html:string,id:string):number|null{
 const at=html.indexOf('"videoDetails":');if(at<0)return null;
 const details=jsonObjectAt(html,html.indexOf('{',at)) as {videoId?:string;viewCount?:string}|null;
 if(details?.videoId!==id||!/^\d+$/.test(details.viewCount||''))return null;const value=Number(details.viewCount);return Number.isSafeInteger(value)&&value>=0?value:null;
}
export async function fetchViews(v:Pick<Video,'id'|'platform'|'url'>):Promise<number|null>{
 try{if(v.platform==='youtube'){const key=await youtubeKey();if(key)return await officialYoutubeViews(v.id,key)}const url=v.platform==='youtube'?`https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`:v.url;
 const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'en-US,en;q=0.8'}});if(!r.ok)return null;
 const text=await r.text();if(v.platform==='youtube')return youtubeViews(text,v.id);
 // Only use counts bound to the exact requested reel, never a related post.
 const marker=`"shortcode":"${v.id}"`,at=text.indexOf(marker);if(at<0)return null;let start=at;for(let i=0;i<15;i++){start=text.lastIndexOf('{',start-1);if(start<0)break;const record=jsonObjectAt(text,start) as {shortcode?:string;video_view_count?:number;video_play_count?:number}|null;if(record?.shortcode===v.id){const n=record.video_view_count??record.video_play_count;return typeof n==='number'&&Number.isSafeInteger(n)&&n>=0?n:null;}}return null;
 }catch{return null;}
}
export async function withViews(videos:Video[]):Promise<Video[]>{
 const rows=await database().prepare("SELECT key,value FROM settings WHERE key LIKE 'views:%'").all<{key:string;value:string}>();const counts=new Map(rows.results.map(r=>[r.key,JSON.parse(r.value)]));
 return videos.map(v=>{const c=counts.get('views:'+v.platform+':'+v.id);const snapshot=(verifiedViews as Record<string,{views:number;updatedAt:number}>)[v.platform+':'+v.id];const known=typeof c?.views==='number'?c:snapshot;return {...v,views:known?.views??null,viewsUpdatedAt:known?.updatedAt??null,viewsAttemptedAt:c?.attemptedAt??0}});
}
export function totalViews(videos:Video[]){const known=videos.filter(v=>typeof v.views==='number');const dates=known.map(v=>v.viewsUpdatedAt||0).filter(Boolean);return {total:known.reduce((sum,v)=>sum+v.views!,0),counted:known.length,videoCount:videos.length,updatedAt:dates.length?Math.min(...dates):null};}
// Publishing must not wait for, or consume, the portfolio-wide refresh cooldown.
export async function refreshVideoViews(video:Video){
 const [previous]=await withViews([video]);
 const views=await fetchViews(video),now=Date.now();
 const value={views:views??previous.views??null,updatedAt:views!==null?now:previous.viewsUpdatedAt??null,attemptedAt:now};
 await database().prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('views:'+video.platform+':'+video.id,JSON.stringify(value)).run();
 return views!==null;
}
export async function refreshViews(force=false,afterConnect=false){
 await seed();const db=database(),now=Date.now();const lock=await db.prepare("INSERT INTO settings (key,value) VALUES ('views-refresh-lock',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(settings.value AS INTEGER)<?").bind(String(now+60000),now).run();
 const rows=await db.prepare('SELECT data FROM videos ORDER BY created DESC').all<{data:string}>();let videos=await withViews(rows.results.map(r=>JSON.parse(r.data)));
 if(lock.meta.changes||afterConnect){const due=videos.filter(v=>force||now-(v.viewsAttemptedAt||0)>21600000).slice(0,50);
 await Promise.all(due.map(async v=>{const views=await fetchViews(v);const value={views:views??v.views??null,updatedAt:views!==null?now:v.viewsUpdatedAt??null,attemptedAt:now};await db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('views:'+v.platform+':'+v.id,JSON.stringify(value)).run()}));
 videos=await withViews(videos);}
 return {videos,stats:totalViews(videos)};
}
