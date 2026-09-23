import {readApiResponse} from '../api-response.js';
'use client';
import {useEffect,useState,type FormEvent} from 'react';
export default function YoutubeConnection({onUpdated}:{onUpdated:()=>Promise<void>}){
 const [connected,setConnected]=useState<boolean|null>(null),[key,setKey]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{fetch('/api/youtube-connection').then(async r=>{if(!r.ok)throw Error();const d=await readApiResponse(r) as {connected:boolean};setConnected(d.connected)}).catch(()=>setMessage('Could not check the YouTube connection. Reload to retry.'))},[]);
 async function connect(e:FormEvent){e.preventDefault();setBusy(true);setMessage('Connecting and fetching your video counts…');try{
 const r=await fetch('/api/youtube-connection',{method:'POST',headers:{'Content-Type':'application/json','x-studio-request':'1'},body:JSON.stringify({key})});
 const d=await readApiResponse(r) as {error?:string;warning?:string;stats?:{counted:number;videoCount:number}};if(!r.ok)throw Error(d.error||'Connection failed. Please try again.');
 setConnected(true);setKey('');if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel('portfolio-updates');c.postMessage('published');c.close()}
 await onUpdated();setMessage(d.warning||`Connected. Counts available for ${d.stats?.counted??0} of ${d.stats?.videoCount??0} videos.`);
 }catch(e){setMessage(e instanceof Error?e.message:'Please try again.')}finally{setBusy(false)}}
 return <section className="panel" style={{marginBottom:24}}><h2>YouTube view counts {connected?'· Connected':''}</h2>
 <p className="hint">{connected?'Your videos use YouTube’s official statistics. New videos fetch their counts when published.':'Connect YouTube to retrieve view counts reliably. Saved counts remain visible until this is connected.'}</p>
 <details open={connected===false}><summary>{connected?'Replace connection key':'Connect your YouTube statistics'}</summary>
 <p className="hint">In Google Cloud, enable YouTube Data API v3 and create an API key restricted to that API. This connection runs on the server, so website/referrer restrictions cannot be used. <a href="https://developers.google.com/youtube/v3/getting-started" target="_blank" rel="noreferrer">Setup guide ↗</a></p>
 <form onSubmit={connect}><label>YouTube Data API key<input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} required minLength={20} maxLength={200} disabled={busy}/></label><p className="hint">Stored privately on your server. Never shown on the public portfolio.</p><button className="primary-button" disabled={busy}>{busy?'Connecting…':'Connect & refresh all videos'}</button></form></details>
 {message&&<p role="status" className="status-message">{message}</p>}</section>
}
