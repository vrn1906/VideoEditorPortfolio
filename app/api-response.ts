export async function readApiResponse(response:Response){
 let data:unknown;
 try{data=await response.json()}catch{
  throw new Error(response.status>=500?'The studio server is temporarily unavailable. Please try again shortly.':'The server returned an unexpected response. Reload the page and try again.');
 }
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('The server returned an unexpected response. Please reload the page.');
 if(!response.ok)throw new Error(typeof (data as {error?:unknown}).error==='string'?(data as {error:string}).error:'Something went wrong. Please try again.');
 return data;
}
