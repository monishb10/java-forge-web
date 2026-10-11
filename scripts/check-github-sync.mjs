// Runs real route code with SQLite and a simulated GitHub API. Makes no network writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'java-forge-github-'));
const require=createRequire(root+'/package.json'),ts=require('typescript');
for(const [name,file] of Object.entries({tracker:'lib/tracker.ts','activity-server':'lib/activity-server.ts',server:'lib/server.ts',curriculum:'lib/curriculum.ts','github-sync':'lib/github-sync.ts',state:'app/api/state/route.ts',github:'app/api/github/route.ts'})){
 const source=fs.readFileSync(root+'/'+file,'utf8')
  .replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__githubTestEnv;')
  .replace("import raw from './curriculum.json';",`const raw=${fs.readFileSync(root+'/lib/curriculum.json','utf8')};`)
  .replace("import rawBank from './practice-bank.json';",`const rawBank=${fs.readFileSync(root+'/lib/practice-bank.json','utf8')};`).replace("import legacyBank from './legacy-practice-bank.json';",`const legacyBank=${fs.readFileSync(root+'/lib/legacy-practice-bank.json','utf8')};`)
  .replace(/'@\/lib\/([^']+)'/g,"'./$1.mjs'");
 fs.writeFileSync(out+'/'+name+'.mjs',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync(root+'/drizzle/0000_right_the_leader.sql','utf8'));
function statement(query,args=[]){return {bind(...values){return statement(query,values)},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){sql.prepare(query).run(...args);return {success:true}}}}
globalThis.__githubTestEnv={DB:{prepare:statement,batch:async entries=>Promise.all(entries.map(x=>x.run()))},TOKEN_ENCRYPTION_KEY:Buffer.alloc(32,5).toString('base64')};
const load=name=>import(pathToFileURL(out+'/'+name+'.mjs'));
const state=await load('state'),github=await load('github'),{findExercise}=await load('curriculum');
const files=new Map(),writes=[];
let mode='ok',branch='main',beforeWrite=null;
globalThis.fetch=async(url,init={})=>{
 const u=new URL(url);assert.equal(u.origin,'https://api.github.com');
 assert.ok(init.headers.Authorization.startsWith('Bearer '));
 if(u.pathname==='/user')return Response.json({id:123,login:'learner',name:'Learner'});
 if(!u.pathname.includes('/contents/')){
  if(mode==='expired')return new Response('{}',{status:401});
  return Response.json({full_name:u.pathname.slice(7),default_branch:branch,permissions:{push:true}});
 }
 const key=u.pathname;
 if(init.method!=='PUT')return files.has(key)?Response.json(files.get(key)):new Response('{}',{status:404});
 const body=JSON.parse(init.body);
 assert.equal(body.sha,undefined,'Completion writes must create only');
 assert.equal(body.branch,branch,'Use the repository’s current default branch');
 assert.equal(body.author.email,'123+learner@users.noreply.github.com');
 if(beforeWrite){const callback=beforeWrite;beforeWrite=null;await callback()}
 if(files.has(key))return new Response('{}',{status:422});
 if(mode==='reject-write')return new Response('{}',{status:403});
 const html_url='https://github.com/'+key.slice(7).replace('/contents/','/blob/'+branch+'/');
 const file={type:'file',content:body.content,sha:crypto.randomUUID(),html_url};
 files.set(key,file);writes.push({key,...body});
 if(mode==='lost-response')throw new Error('Network response lost after commit');
 return Response.json({content:file,commit:{html_url:'https://github.com/learner/practice/commit/'+writes.length}},{status:201});
};
async function call(route,data,user='student',origin){
 const headers={'content-type':'application/json'};if(user)headers['oai-authenticated-user-id']=user;if(origin)headers.origin=origin;
 const response=await route[data?'POST':'GET'](new Request('https://test.invalid/api',{method:data?'POST':'GET',headers,body:data?JSON.stringify(data):undefined}));
 return {...await response.json(),httpStatus:response.status};
}
const code='public class Main { public static void main(String[] args) { System.out.println(12); } }';
function verified(id,source=code,user='student',testCount){
 const e=findExercise(id).exercise,runId=crypto.randomUUID();
 const cases=e.tests.slice(0,testCount??e.tests.length).map(t=>({input:t.input,expected:t.output,strictWhitespace:!!t.strictWhitespace}));
 sql.prepare('INSERT INTO runs(id,user_id,exercise_id,code,result,created_at) VALUES(?,?,?,?,?,?)').run(runId,user,id,source,JSON.stringify({passed:true,cases}),Date.now());
 return {action:'submit',id,code:source,answer:'',runId};
}
let checks=0;
function check(name,value){assert.ok(value,name);checks++}
function count(){return writes.length}
async function connect(repo='learner/practice',user='student'){return call(github,{action:'connect',token:'mock-private-token',repo},user)}

try{
 check('Anonymous saves blocked',(await call(github,{action:'save',id:'variables-2'},null)).httpStatus===401);
 check('Cross-origin saves blocked',(await call(github,{action:'save',id:'variables-2'},'student','https://elsewhere.invalid')).httpStatus===403);
 await connect();
 await call(state,{action:'draft',id:'variables-2',code});check('Drafts make no commit',count()===0);
 check('Unfinished work cannot be saved',(await call(github,{action:'save',id:'variables-2'})).httpStatus===400);
 check('Partial tests do not complete',(await call(state,verified('variables-2',code,'student',3))).httpStatus===400&&count()===0);
 const accepted=await call(state,verified('variables-2'));
 check('Accepted submission automatically creates one commit',accepted.record.status==='accepted'&&accepted.github.status==='saved'&&count()===1);
 check('Saved status and commit link returned',accepted.record.githubStatus==='saved'&&accepted.record.githubCommitUrl&&accepted.record.githubRepo==='learner/practice');
 check('Java file contains the actual solution',Buffer.from(writes[0].content,'base64').toString().endsWith(code)&&writes[0].key.endsWith('/variables-2/Main.java'));
 const firstCompleted=accepted.record.completedAt;
 await call(state,verified('variables-2'));
 check('Repeat submission does not add a commit',count()===1);
 await call(state,verified('variables-2',code+'\n// improved version'));
 check('Another accepted version does not duplicate the completion commit',count()===1);
 check('First completion date preserved',(await call(state)).records['variables-2'].completedAt===firstCompleted);
 await call(github,{action:'save',id:'variables-2'});check('Manual retry uses the same completion',count()===1);

 check('Self-review cannot complete a program',(await call(state,{action:'review',id:'hashmap-2',code,answer:'A written answer is not a solution.'})).httpStatus===400);
 check('Self-review makes no commit',count()===1);
 const second=await call(state,verified('hashmap-2'));
 check('A different accepted program creates its own Java commit',second.github.status==='saved'&&count()===2&&writes.at(-1).key.endsWith('/hashmap-2/Main.java'));
 await call(state,verified('hashset-2'));
 check('Every new accepted problem auto-commits once',count()===3);

 mode='expired';const failed=await call(state,verified('input-output-2'));
 check('Expired token keeps completion saved',failed.httpStatus===200&&failed.record.status==='accepted'&&failed.github.status==='error'&&count()===3);
 check('Save error is persistent and visible',(await call(state)).records['input-output-2'].githubError);
 mode='ok';await call(github,{action:'save',id:'input-output-2'});
 check('Retry after token recovery adds one commit',count()===4);

 mode='reject-write';const failedWrite=await call(state,verified('operators-2'));
 check('Rejected write preserves accepted work',failedWrite.record.status==='accepted'&&failedWrite.github.status==='error'&&count()===4);
 mode='ok';await call(github,{action:'save',id:'operators-2'});check('Rejected write can be retried',count()===5);
 mode='lost-response';const recovered=await call(state,verified('conditions-2'));mode='ok';
 check('Lost successful response recovers without a second commit',recovered.github.status==='saved'&&count()===6);

 const parallel=verified('loops-2');const results=await Promise.all([call(state,parallel),call(state,parallel)]);
 check('Concurrent completion requests create one file',results.every(r=>r.github.status==='saved')&&count()===7);
 sql.prepare('DELETE FROM records WHERE user_id=? AND id=?').run('student','github:learner/practice/loops-2');
 await call(github,{action:'save',id:'loops-2'});check('Existing GitHub file recovers missing receipt',count()===7);

 const unrelatedKey='/repos/learner/practice/contents/java-forge/methods/methods-2/Main.java';
 files.set(unrelatedKey,{type:'file',content:Buffer.from('unrelated existing file').toString('base64'),html_url:'https://github.com/learner/practice/blob/main/other'});
 const collision=await call(state,verified('methods-2'));
 check('An unrelated repository file is never overwritten',collision.github.status==='error'&&count()===7&&Buffer.from(files.get(unrelatedKey).content,'base64').toString()==='unrelated existing file');

 const loaded=await call(state),stored=sql.prepare('SELECT token FROM settings WHERE user_id=?').get('student');
 check('Private token is encrypted at rest',stored.token!=='mock-private-token'&&!stored.token.includes('mock-private-token'));
 check('Neither plaintext nor encrypted token reaches state',!JSON.stringify(loaded).includes('mock-private-token')&&!JSON.stringify(loaded).includes(stored.token));
 check('GitHub receipts are separate from study progress',!Object.keys(loaded.records).some(id=>id.startsWith('github:')));
 check('Other account cannot use this connection',(await call(github,{action:'save',id:'variables-2'},'another-student')).httpStatus===400);

 beforeWrite=async()=>sql.prepare("UPDATE records SET data=json_set(data,'$.code',?,'$.status','draft') WHERE user_id=? AND id=?").run('newer code from another tab','student','arrays-2');
 await call(state,verified('arrays-2'));
 const newer=(await call(state)).records['arrays-2'];
 check('GitHub response does not overwrite a newer draft',newer.code==='newer code from another tab'&&newer.status==='draft'&&newer.githubStatus==='saved'&&count()===8);

 branch='study';await connect('learner/second-repo');await call(state,verified('variables-2'));
 check('A different repository uses its current default branch',count()===9&&writes.at(-1).branch==='study');
 await connect();await call(state,verified('variables-2'));check('Reconnecting original repo keeps duplicate protection',count()===9);
 files.delete(writes[0].key);await call(github,{action:'save',id:'variables-2'});check('A prior completion is not re-created after external deletion',count()===9);
 await call(github,{action:'disconnect'});const unconnected=await call(state,verified('strings-2'));
 check('Disconnected completion still saves without a GitHub write',unconnected.record.status==='accepted'&&unconnected.github.status==='not-connected'&&count()===9);
 console.log(JSON.stringify({passed:checks,commitsSimulated:count(),externalWrites:0,scope:'Completion routes, duplicate protection, concurrency, failure recovery, account isolation, and token privacy'}));
}finally{sql.close();fs.rmSync(out,{recursive:true,force:true})}
