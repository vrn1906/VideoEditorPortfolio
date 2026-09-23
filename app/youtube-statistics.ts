import {database,UserError} from './server.js';
export async function youtubeKey(){const row=await database().prepare("SELECT value FROM settings WHERE key='youtube-api-key'").first<{value:string}>();return row?.value||process.env.YOUTUBE_API_KEY||'';}
export async function officialYoutubeViews(id:string,key:string):Promise<number|null>{
 const response=await fetch('https://www.googleapis.com/youtube/v3/videos?part=statistics&id='+encodeURIComponent(id),{headers:{'X-Goog-Api-Key':key},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new UserError(response.status===429?'YouTube’s request limit was reached. Try again later.':'YouTube could not verify this connection. Check that YouTube Data API v3 is enabled and the key allows server requests.',400);
 const data=await response.json() as {items?:{id:string;statistics?:{viewCount?:string}}[]};
 const raw=data.items?.find(item=>item.id===id)?.statistics?.viewCount;
 if(!raw||!/^\d+$/.test(raw))return null;
 const count=Number(raw);return Number.isSafeInteger(count)&&count>=0?count:null;
}
