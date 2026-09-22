import {neon} from '@neondatabase/serverless';
let ready:Promise<void>|undefined;
let testQuery:((sql:string,params:unknown[])=>Promise<{rows:Record<string,unknown>[];rowCount:number}>)|undefined;
export function setTestDatabase(query:typeof testQuery){if(process.env.NODE_ENV!=='test'||process.env.VERCEL)throw Error('Test database not allowed');testQuery=query;ready=undefined}
async function query(sql:string,params:unknown[]=[]){
 if(testQuery)return testQuery(sql,params);
 if(!process.env.DATABASE_URL)throw Error('Connect a Postgres database using DATABASE_URL.');
 return neon(process.env.DATABASE_URL).query(sql,params,{fullResults:true});
}
async function initialize(){for(const sql of [
 'CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY,data TEXT NOT NULL,created BIGINT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY,value TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY,expires BIGINT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires BIGINT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS media (key TEXT PRIMARY KEY,body TEXT NOT NULL,type TEXT NOT NULL)'])await query(sql)}
async function ensure(){ready??=initialize().catch(e=>{ready=undefined;throw e});await ready}
class Statement{
 values:unknown[]=[];
 constructor(public sql:string){}
 bind(...values:unknown[]){this.values=values;return this}
 compiled(){let n=0;return this.sql.replace(/\?/g,()=>'$'+(++n)).replace(/AS INTEGER/gi,'AS BIGINT')}
 async execute(){await ensure();return query(this.compiled(),this.values)}
 async first<T=Record<string,unknown>>():Promise<T|null>{return (await this.execute()).rows[0] as T||null}
 async all<T=Record<string,unknown>>(){return {results:(await this.execute()).rows as T[]}}
 async run(){return {meta:{changes:(await this.execute()).rowCount||0}}}
}
export const db={prepare:(sql:string)=>new Statement(sql),batch:async(items:Statement[])=>{
 await ensure();
 if(testQuery){const results=[];for(const item of items)results.push(await item.run());return results}
 const sql=neon(process.env.DATABASE_URL!);
 const results=await sql.transaction(items.map(item=>sql.query(item.compiled(),item.values)),{fullResults:true});
 return results.map(result=>({meta:{changes:result.rowCount||0}}));
}};
export const media={
 async put(key:string,bytes:Uint8Array,options:{httpMetadata:{contentType:string}}){await db.prepare('INSERT INTO media (key,body,type) VALUES (?,?,?)').bind(key,Buffer.from(bytes).toString('base64'),options.httpMetadata.contentType).run()},
 async get(key:string){const row=await db.prepare('SELECT body,type FROM media WHERE key=?').bind(key).first<{body:string;type:string}>();return row?{body:new Uint8Array(Buffer.from(row.body,'base64')),httpMetadata:{contentType:row.type}}:null}
};
