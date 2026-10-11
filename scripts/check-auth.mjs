import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';

const root=path.resolve(import.meta.dirname,'..');
assert.ok(fs.existsSync(root+'/lib/auth.ts'),'The standalone worker must verify a session before trusting identity headers');
const require=createRequire(root+'/package.json');
const ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'java-forge-auth-'));
fs.writeFileSync(dir+'/auth.mjs',ts.transpileModule(fs.readFileSync(root+'/lib/auth.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {handleRequest}=await import(dir+'/auth.mjs');
const sql=new DatabaseSync(':memory:');
for(const name of fs.readdirSync(root+'/drizzle').filter(n=>n.endsWith('.sql')).sort())sql.exec(fs.readFileSync(root+'/drizzle/'+name,'utf8'));
function prepared(query,args=[]){return {bind(...a){return prepared(query,a)},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return {success:true,meta:{changes:Number(sql.prepare(query).run(...args).changes)}}}};}
const env={DB:{prepare:prepared,batch:async queries=>Promise.all(queries.map(q=>q.run()))},APP_URL:'https://forge.test',GITHUB_CLIENT_ID:'client-fixture',GITHUB_CLIENT_SECRET:'secret-fixture'};
const tokenFor=code=>'oauth-token-'+code;
let oauthCalls=0,tokenBody;
globalThis.fetch=async(url,init={})=>{
 if(String(url)==='https://github.com/login/oauth/access_token'){
  oauthCalls++;tokenBody=new URLSearchParams(init.body);
  return Response.json({access_token:tokenFor(tokenBody.get('code')),token_type:'bearer'});
 }
 if(String(url)==='https://api.github.com/user'){
  const b=new Headers(init.headers).get('Authorization');
  if(b==='Bearer '+tokenFor('provider-error'))return Response.json({message:'unavailable'},{status:503});
  return Response.json(b==='Bearer '+tokenFor('bob')?{id:202,login:'bob',name:'Bob'}:{id:101,login:'alice',name:'Alice'});
 }
 throw new Error('Unexpected upstream request');
};
let forwarded=0;
async function next(req){
 forwarded++;
 const id=req.headers.get('oai-authenticated-user-id');
 if(req.method==='POST'){
  const b=await req.json();
  sql.prepare('INSERT INTO records(user_id,id,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data').run(id,'draft',JSON.stringify(b),'now');
 }
 return Response.json({id,other:req.headers.get('oai-authenticated-user-email'),records:sql.prepare('SELECT data FROM records WHERE user_id=?').all(id||'')});
}
function request(pathname,{cookie='',headers={},method='GET',body}={}){return new Request(env.APP_URL+pathname,{method,headers:{...headers,...cookie?{cookie}:{},...method!=='GET'?{origin:env.APP_URL,'content-type':'application/json'}:{}},body:body===undefined?undefined:JSON.stringify(body)});}
const call=(pathname,options)=>handleRequest(request(pathname,options),env,next);
const cookies=r=>r.headers.getSetCookie();
const cookieValue=(r,name)=>cookies(r).find(x=>x.startsWith(name+'='))?.split(';')[0];
let passed=0;const check=(name,condition)=>{assert.ok(condition,name);passed++;};

check('Anonymous API denied',(await call('/api/state')).status===401);
check('Forged platform header denied',(await call('/api/state',{headers:{'oai-authenticated-user-id':'victim'}})).status===401);
check('Anonymous account returns no identity',(await (await call('/api/account')).json()).user===null);
check('Unknown auth endpoint returns 404',(await call('/auth/not-real')).status===404);

async function start(){const response=await call('/auth/github');check('OAuth redirects',response.status===302);const url=new URL(response.headers.get('location'));return {response,url,state:url.searchParams.get('state'),cookie:cookieValue(response,'__Host-jf_oauth')};}
const first=await start();
check('OAuth uses GitHub',first.url.origin==='https://github.com');
check('Only profile scope requested',first.url.searchParams.get('scope')==='read:user');
check('PKCE S256 challenge',first.url.searchParams.get('code_challenge_method')==='S256'&&first.url.searchParams.get('code_challenge').length===43);
check('Exact callback URL',first.url.searchParams.get('redirect_uri')==='https://forge.test/auth/callback');
check('OAuth cookie protects browser state',cookies(first.response).some(v=>v.includes('HttpOnly')&&v.includes('Secure')&&v.includes('SameSite=Lax')&&v.includes('Path=/')));
check('No arbitrary redirect target',!first.url.searchParams.has('return_to'));
check('Missing state fails',(await call('/auth/callback?code=alice',{cookie:first.cookie})).status===400);
check('Missing browser cookie fails',(await call('/auth/callback?code=alice&state='+first.state)).status===400);
check('Wrong browser cookie fails',(await call('/auth/callback?code=alice&state='+first.state,{cookie:'__Host-jf_oauth=wrong'})).status===400);
check('Invalid callbacks never exchange tokens',oauthCalls===0);

const login=await call('/auth/callback?code=alice&state='+first.state,{cookie:first.cookie});
check('Valid callback completes',login.status===303&&login.headers.get('location')==='/');
const alice=cookieValue(login,'__Host-jf_session');
check('Session cookie issued',!!alice);
check('Session is HttpOnly and Secure',cookies(login).some(v=>v.startsWith('__Host-jf_session=')&&v.includes('HttpOnly')&&v.includes('Secure')&&v.includes('SameSite=Lax')));
const challenge=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(tokenBody.get('code_verifier')))).toString('base64url');
check('PKCE verifier matches challenge',challenge===first.url.searchParams.get('code_challenge'));
check('Session raw token not stored',!JSON.stringify(sql.prepare('SELECT * FROM auth_sessions').all()).includes(alice.split('=')[1]));
check('Provider access token not stored',!JSON.stringify(sql.prepare('SELECT * FROM auth_sessions').all()).includes('oauth-token'));
const replay=await call('/auth/callback?code=alice&state='+first.state,{cookie:first.cookie});
check('Callback cannot replay',replay.status===400&&oauthCalls===1);
const account=await (await call('/api/account',{cookie:alice})).json();
check('Verified numeric GitHub ID is stable',account.user.id==='github:101'&&account.user.login==='alice');
check('Account response excludes secret values',!JSON.stringify(account).includes('secret-fixture')&&!JSON.stringify(account).includes('oauth-token'));
const corrected=await (await call('/api/state',{cookie:alice,headers:{'oai-authenticated-user-id':'victim','oai-authenticated-user-email':'victim@example.test'}})).json();
check('Untrusted identity is replaced',corrected.id==='github:101'&&corrected.other===null);
check('Responses cannot be shared by a cache',(await call('/api/state',{cookie:alice})).headers.get('cache-control').includes('no-store'));
check('Mutation requires expected account',(await call('/api/state',{cookie:alice,method:'POST',body:{code:'draft'}})).status===409);
check('Alice can save her own draft',(await call('/api/state',{cookie:alice,method:'POST',headers:{'x-java-forge-account':'github:101'},body:{code:'alice only'}})).status===200);

const second=await start();
const bob=cookieValue(await call('/auth/callback?code=bob&state='+second.state,{cookie:second.cookie}),'__Host-jf_session');
check('Bob starts without Alice progress',(await (await call('/api/state',{cookie:bob})).json()).records.length===0);
check('Stale Alice tab cannot write into Bob',(await call('/api/state',{cookie:bob,method:'POST',headers:{'x-java-forge-account':'github:101'},body:{code:'leaked'}})).status===409);
check('Stale Alice tab cannot load Bob data',(await call('/api/state',{cookie:bob,headers:{'x-java-forge-account':'github:101'}})).status===409);
check('Bob can save independently',(await call('/api/state',{cookie:bob,method:'POST',headers:{'x-java-forge-account':'github:202'},body:{code:'bob only'}})).status===200);
check('Alice record unchanged',(await (await call('/api/state',{cookie:alice})).json()).records[0].data.includes('alice only'));

const cross=new Request('https://forge.test/api/state',{method:'POST',headers:{cookie:alice,origin:'https://attacker.test','x-java-forge-account':'github:101','content-type':'application/json'},body:'{}'});
check('Cross-origin mutation blocked',(await handleRequest(cross,env,next)).status===403);
const noOrigin=new Request('https://forge.test/api/state',{method:'POST',headers:{cookie:alice,'x-java-forge-account':'github:101','content-type':'application/json'},body:'{}'});
check('Missing mutation origin blocked',(await handleRequest(noOrigin,env,next)).status===403);
check('Logout GET cannot mutate',(await call('/auth/logout',{cookie:alice})).status===405);
check('Logout from stale account blocked',(await call('/auth/logout',{cookie:bob,method:'POST',headers:{'x-java-forge-account':'github:101'}})).status===409);
check('Logout succeeds',(await call('/auth/logout',{cookie:alice,method:'POST',headers:{'x-java-forge-account':'github:101'}})).status===200);
check('Revoked session denied',(await call('/api/state',{cookie:alice})).status===401);
check('Other learner stays signed in',(await call('/api/state',{cookie:bob})).status===200);
sql.prepare('UPDATE auth_sessions SET expires_at=0').run();
check('Expired session denied',(await call('/api/state',{cookie:bob})).status===401);
const expired=await start();sql.prepare('UPDATE auth_attempts SET expires_at=0').run();
check('Expired OAuth attempt denied',(await call('/auth/callback?code=alice&state='+expired.state,{cookie:expired.cookie})).status===400);
const failed=await start();check('Provider failure creates no session',(await call('/auth/callback?code=provider-error&state='+failed.state,{cookie:failed.cookie})).status===502);
check('Wrong host is rejected',(await handleRequest(new Request('https://wrong.test/auth/github'),env,next)).status===403);
check('Missing OAuth configuration fails closed',(await handleRequest(request('/auth/github'),{...env,GITHUB_CLIENT_SECRET:''},next)).status===503);
check('Invalid session never reaches application',forwarded<20);
console.log(`${passed} authentication and account-isolation checks passed.`);
sql.close();fs.rmSync(dir,{recursive:true,force:true});
