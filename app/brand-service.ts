import {knownBrand,brandKey} from './brand-catalog';
import {UserError} from './server';
async function data(url:string){const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(9000),headers:{'User-Agent':'VarunPortfolio/1.0 (brand logo lookup)'}});if(!r.ok)throw Error('Lookup unavailable');return await r.json() as Record<string,any>}
export async function resolveBrand(name:string,website=''){
 if(typeof name!=='string'||!name.trim()||name.length>100)throw new UserError('Enter the brand name.');
 const known=knownBrand(name);if(known)return known;
 if(website){let u:URL;try{u=new URL(website.includes('://')?website:'https://'+website)}catch{throw new UserError('Enter the brand’s website, for example brand.com.')}
 if(u.protocol!=='https:'||u.username||u.password||u.port||!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(u.hostname))throw new UserError('Enter a public brand website.');
 return {name:name.trim(),domain:u.hostname,logo:`https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=128`};}
 try{const search=await data(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=8`);
 const options=(search.search||[]).filter((x:any)=>/company|brand|corporation|business|manufacturer|chain|service|retailer|organisation|organization/i.test(x.description||''));
 const match=options.find((x:any)=>brandKey(x.label).replace(/incorporated$|inc$|company$|ltd$/,'')===brandKey(name));
 if(match&&/^Q\d+$/.test(match.id)){const result=await data(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${match.id}&props=claims&format=json`);const file=result.entities?.[match.id]?.claims?.P154?.find((x:any)=>x.rank!=='deprecated')?.mainsnak?.datavalue?.value;
 if(typeof file==='string')return {name:name.trim(),domain:'',logo:`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`};}
 }catch{}
 return {name:name.trim(),domain:'',logo:'',warning:'No confident logo match. Add the brand website to fetch its icon, or upload the logo.'};
}
