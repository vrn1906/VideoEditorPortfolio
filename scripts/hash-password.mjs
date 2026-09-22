import {createInterface} from 'node:readline';
import {Writable} from 'node:stream';
import {randomBytes,pbkdf2Sync} from 'node:crypto';
if(!process.stdin.isTTY)throw Error('Run this command in an interactive terminal.');
const output=new Writable({write(_chunk,_encoding,callback){callback()}});
const rl=createInterface({input:process.stdin,output,terminal:true});
process.stdout.write('Choose an admin password (12–128 characters, hidden): ');
rl.question('',password=>{
 rl.close();process.stdout.write('\n');
 if(password.length<12||password.length>128){console.error('Use 12–128 characters.');process.exitCode=1;return}
 const salt=randomBytes(32).toString('hex');
 console.log('Copy this value into the server-only ADMIN_PASSWORD_HASH variable:');
 console.log(salt+':'+pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex'));
});
