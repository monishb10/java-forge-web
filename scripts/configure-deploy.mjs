import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const LOCAL_DATABASE='00000000-0000-4000-8000-000000000000';

export function deploymentConfig(values,local=false){
 const raw=values.APP_URL||(local?'http://127.0.0.1:5173':'');
 if(!raw)throw new Error('Set APP_URL to the public website address.');
 let url;try{url=new URL(raw)}catch{throw new Error('APP_URL must be a valid origin.')}
 const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.protocol!=='https:'&&!(local&&loopback&&url.protocol==='http:'))throw new Error('APP_URL must use HTTPS for deployment.');
 if(url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw new Error('APP_URL must contain only the origin, without a path or credentials.');
 const database=values.D1_DATABASE_ID||(local?LOCAL_DATABASE:'');
 if(!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(database)||(!local&&database===LOCAL_DATABASE))throw new Error('Set D1_DATABASE_ID to your new Cloudflare D1 database ID.');
 const client=values.OAUTH_CLIENT_ID||(local?'set-in-dev-vars':'');
 if(!client)throw new Error('Set OAUTH_CLIENT_ID from your GitHub OAuth app.');
 return {$schema:'node_modules/wrangler/config-schema.json',name:'java-forge-web',main:'build/worker.ts',compatibility_date:'2026-05-15',compatibility_flags:['nodejs_compat'],workers_dev:true,preview_urls:false,
  vars:{APP_URL:url.origin,GITHUB_CLIENT_ID:client},d1_databases:[{binding:'DB',database_name:'java-forge-progress',database_id:database,migrations_dir:'drizzle'}]};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const config=deploymentConfig(process.env,process.argv.includes('--local'));fs.writeFileSync(new URL('../wrangler.jsonc',import.meta.url),JSON.stringify(config,null,2)+'\n');console.log('Worker configuration written. Secret values are not included.');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
