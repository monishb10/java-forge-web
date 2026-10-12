import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'java-forge-routes-'));
const require=createRequire(root+'/package.json');const ts=require('typescript');
for(const [dest,src] of Object.entries({tracker:'lib/tracker.ts','activity-server':'lib/activity-server.ts',server:'lib/server.ts',curriculum:'lib/curriculum.ts',compiler:'lib/compiler.ts',state:'app/api/state/route.ts',run:'app/api/run/route.ts',github:'app/api/github/route.ts',timing:'app/api/time/route.ts',githubSync:'lib/github-sync.ts'})){
 let text=fs.readFileSync(root+'/'+src,'utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__testEnv;').replace("import raw from './curriculum.json';",`const raw=${fs.readFileSync(root+'/lib/curriculum.json','utf8')};`).replace("import rawBank from './practice-bank.json';",`const rawBank=${fs.readFileSync(root+'/lib/practice-bank.json','utf8')};`).replace("import legacyBank from './legacy-practice-bank.json';",`const legacyBank=${fs.readFileSync(root+'/lib/legacy-practice-bank.json','utf8')};`).replaceAll("'@/lib/tracker'","'./tracker.mjs'").replaceAll("'@/lib/activity-server'","'./activity-server.mjs'").replaceAll("'@/lib/server'","'./server.mjs'").replaceAll("'@/lib/curriculum'","'./curriculum.mjs'").replaceAll("'@/lib/compiler'","'./compiler.mjs'").replaceAll("'@/lib/github-sync'","'./githubSync.mjs'");
 fs.writeFileSync(dir+'/'+dest+'.mjs',ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync(root+'/drizzle/0000_right_the_leader.sql','utf8'));
function prepared(query,args=[]){return {bind(...a){return prepared(query,a)},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){sql.prepare(query).run(...args);return {success:true}}}}
globalThis.__testEnv={DB:{prepare:prepared,batch:async entries=>Promise.all(entries.map(x=>x.run()))},TOKEN_ENCRYPTION_KEY:Buffer.alloc(32,7).toString('base64')};
const state=await import(dir+'/state.mjs'),run=await import(dir+'/run.mjs'),github=await import(dir+'/github.mjs'),curriculum=await import(dir+'/curriculum.mjs');
const timing=await import(dir+'/timing.mjs');
let gitWrites=0,gitFile=null,providerCalls=new Map();
globalThis.fetch=async(url,init={})=>{url=String(url);const reply=x=>Response.json(x);
 if(url.includes('api.paiza.io')){if(url.includes('/create.')){let p=new URLSearchParams(init.body);const id=crypto.randomUUID();providerCalls.set(id,{code:p.get('source_code'),input:p.get('input')});return reply({id,status:'running'})}const id=new URL(url).searchParams.get('id'),v=providerCalls.get(id);if(v.code==='COMPILE_ERROR')return reply({status:'completed',build_result:'failure',build_stderr:'syntax error',result:null});if(v.code==='RUNTIME_ERROR')return reply({status:'completed',build_result:'success',result:'failure',exit_code:'1',stderr:'ArithmeticException'});const nums=v.input.trim().split(/\s+/).map(Number);return reply({status:'completed',build_result:'success',result:'success',exit_code:'0',stdout:v.code==='WRONG_ANSWER'?'0\n':String(nums[0]*nums[1])+'\n'});}
 if(url==='https://api.github.com/user')return reply({login:'test-user',id:123,name:'Test User'});
 if(url.includes('/contents/')){if(init.method==='PUT'){gitWrites++;const b=JSON.parse(init.body);gitFile={...b,sha:'sha-sample',html_url:'https://github.com/test-user/java-practice/blob/main/Main.java'};return reply({content:gitFile,commit:{html_url:'https://github.com/test-user/java-practice/commit/sample'}})}return gitFile?reply(gitFile):new Response('{}',{status:404});}
 if(url.includes('api.github.com/repos/'))return reply({full_name:'test-user/java-practice',default_branch:'main',permissions:{push:true},fork:false});throw new Error('Unexpected fetch '+url);
};
const results=[];function check(name,condition){results.push({name,pass:!!condition});if(!condition)console.log('FAIL',name)}
async function call(module,data,user='qa'){let headers={};if(user)headers['oai-authenticated-user-id']=user;if(data)headers['content-type']='application/json';const r=await module[data?'POST':'GET'](new Request('https://test.invalid/api',{method:data?'POST':'GET',headers,body:data?JSON.stringify(data):undefined}));return {status:r.status,...await r.json()};}
check('20 foundation topics and 640 unique exercises',curriculum.lessons.length===20&&new Set(curriculum.lessons.flatMap(l=>curriculum.exercises(l).map(e=>e.id))).size===640);
check('32 exercises for every topic',curriculum.lessons.every(l=>curriculum.exercises(l).length===32));
check('64 unique inputs in every foundation suite',curriculum.lessons.every(l=>curriculum.exercises(l).every(e=>e.tests.length===64&&new Set(e.tests.map(t=>t.input)).size===64)));
check('Unauthorized state rejected',(await call(state,null,null)).status===401);
check('Progress loads',(await call(state)).status===200);
const topic=await call(state,{action:'topic',id:'variables',mastered:true,read:true,note:'boundary notes'});check('Topic persists',topic.topic.mastered&&topic.topic.read);
check('Account isolation',!(await call(state,null,'other')).topics.variables);
for(const id of ['java-environment','exception-handling','collections-framework','generics','file-handling','complexity','multithreading','java8-features','final-review']){
 const saved=await call(state,{action:'topic',id,mastered:true,read:true,studiedToday:true,note:'My roadmap note'});
 check('Roadmap lesson saves: '+id,saved.status===200&&saved.topic?.mastered&&saved.event?.id===id);
 const own=await call(state),other=await call(state,null,'other');
 check('Roadmap note persists privately: '+id,own.topics[id]?.note==='My roadmap note'&&!other.topics[id]);
}
check('Unknown lesson still rejected',(await call(state,{action:'topic',id:'fake-lesson',read:true})).status===400);
const code='CORRECT_RECTANGLE_JAVA';
check('Compiler consent enforced',(await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:false})).status===400);
const result=await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:true});check('All expected cases verified',result.passed&&result.cases.length===12);
const submit={action:'submit',id:'variables-2',code,answer:'Use long values to multiply without int overflow.',runId:result.id};
const accepted=await call(state,submit);
check('Passed code accepted',accepted.record.status==='accepted');
check('Expanded test suite recorded',accepted.record.testCount===12&&accepted.record.suiteVersion==='expanded-v2');
const samples=await call(run,{mode:'samples',exerciseId:'variables-2',code,consent:true});
check('Run checks three examples only',samples.cases.length===3&&!samples.passed);
check('Samples cannot authorize submission',(await call(state,{...submit,runId:samples.id})).status===400);
const batch1=await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:true,batch:true});
check('Large-suite batches stay incomplete',batch1.complete===false&&batch1.cases.length===3&&!batch1.passed&&batch1.total===12);
check('Partial batch cannot authorize submission',(await call(state,{...submit,runId:batch1.id})).status===400);
check('Another account cannot resume a run',(await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:true,batch:true,runId:batch1.id},'other')).status===400);
check('Changed source cannot resume a run',(await call(run,{mode:'tests',exerciseId:'variables-2',code:code+' changed',consent:true,batch:true,runId:batch1.id})).status===400);
const prefixExercise=curriculum.findExercise('variables-2').exercise, unchangedSuite=prefixExercise.tests;
prefixExercise.tests=unchangedSuite.map((t,i)=>i===5?{...t,input:'99 7\n',output:'693\n'}:t);
check('Changed unrun suffix rejects resume even with the same version',(await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:true,batch:true,runId:batch1.id})).status===400);
prefixExercise.tests=unchangedSuite;
let completedBatch=batch1;
for(let i=0;i<3;i++)completedBatch=await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:true,batch:true,runId:batch1.id});
check('All batches produce the exact complete suite',completedBatch.complete===true&&completedBatch.passed&&completedBatch.cases.length===12);
check('Verified full batch can authorize submission',(await call(state,{...submit,runId:batch1.id})).record?.status==='accepted');
const expandedExercise=curriculum.findExercise('variables-2').exercise, originalTests=expandedExercise.tests;
expandedExercise.tests=Array.from({length:64},(_,i)=>({input:`${i} 7\n`,output:`${i*7}\n`,label:`Boundary fixture ${i}`}));
let longBatch=await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:true,batch:true});
check('64-case run reports its true total',longBatch.total===64&&longBatch.cases.length===3&&!longBatch.passed);
for(let i=0;i<21;i++)longBatch=await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:true,batch:true,runId:longBatch.id});
check('64-case run finishes with exact ordered inputs',longBatch.complete===true&&longBatch.passed&&longBatch.cases.length===64&&longBatch.cases.every((c,i)=>c.input===expandedExercise.tests[i].input));
check('Complete 64-case run can be accepted',(await call(state,{...submit,runId:longBatch.id})).record?.testCount===64);
expandedExercise.tests=expandedExercise.tests.map(t=>({...t,strictWhitespace:true}));
const savedFetch=globalThis.fetch;
globalThis.fetch=async(url,init)=>String(url).includes('api.paiza.io')?new Response('{}',{status:503}):savedFetch(url,init);
const unavailableBatch=await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:true,batch:true});
check('Unavailable strict cases retain exact suite metadata',unavailableBatch.cases.every((c,i)=>c.strictWhitespace===true&&c.expected===expandedExercise.tests[i].output));
globalThis.fetch=savedFetch;
const recoveredBatch=await call(run,{mode:'tests',exerciseId:'variables-2',code,consent:true,batch:true,runId:unavailableBatch.id});
check('Strict suite can resume after compiler unavailability',recoveredBatch.status===200&&recoveredBatch.cases.length===6&&!recoveredBatch.passed);
expandedExercise.tests=originalTests;
check('Changed suite cannot reuse the 64-case result',(await call(state,{...submit,runId:longBatch.id})).status===400);
// Restore the valid legacy completion used by the remaining persistence checks.
await call(state,submit);
const oldId=crypto.randomUUID();
sql.prepare('INSERT INTO runs(id,user_id,exercise_id,code,result,created_at) VALUES(?,?,?,?,?,?)').run(oldId,'qa','variables-2',code,JSON.stringify({...result,cases:result.cases.slice(0,3)}),Date.now());
check('Earlier three-test suite requires fresh verification',(await call(state,{...submit,runId:oldId})).status===400);
check('Label-only changes do not invalidate exact tests',accepted.status===200);
check('Changed code rejected',(await call(state,{...submit,code:code+'changed'})).status===400);
check('Cross-account run rejected',(await call(state,submit,'other')).status===400);
check('Submission needs no written explanation',(await call(state,{...submit,answer:''})).record.status==='accepted');
const wrong=await call(run,{mode:'tests',exerciseId:'variables-2',code:'WRONG_ANSWER',consent:true});check('Wrong answer distinguished',!wrong.passed&&wrong.cases.some(c=>c.status==='wrong-answer'));
const compile=await call(run,{mode:'custom',code:'COMPILE_ERROR',consent:true});check('Compiler error distinguished',compile.cases[0].status==='compile-error');
const runtime=await call(run,{mode:'custom',code:'RUNTIME_ERROR',consent:true});check('Runtime error distinguished',runtime.cases[0].status==='runtime-error');
check('Retired written exercises cannot be reviewed',(await call(state,{action:'review',id:'variables-3',answer:'A written response no longer completes a problem.'})).status===400);
check('Cannot self-review tested exercise',(await call(state,{...submit,action:'review'})).status===400);
check('GitHub requires connection',(await call(github,{action:'save',id:'variables-2'})).status===400);
const token='mock-fine-grained-token';const connection=await call(github,{action:'connect',token,repo:'test-user/java-practice',email:''});check('GitHub connection verified',connection.connected&&connection.email==='123+test-user@users.noreply.github.com');
const stored=sql.prepare('SELECT * FROM settings').get();check('Token encrypted at rest',!stored.token.includes(token)&&stored.token.includes('.'));
const publicState=await call(state);check('Token absent from API responses',!JSON.stringify(publicState).includes(token)&&!JSON.stringify(publicState).includes(stored.token));
const saved=await call(github,{action:'save',id:'variables-2'});check('Completed solution commits',saved.status==='saved'&&gitWrites===1&&!!saved.url);
const duplicate=await call(github,{action:'save',id:'variables-2'});check('Identical solution avoids duplicate commit',duplicate.unchanged&&gitWrites===1);
check('GitHub account isolation',(await call(github,{action:'save',id:'variables-2'},'other')).status===400);
check('Disconnect deletes encrypted token',(await call(github,{action:'disconnect'})).status===200&&!(await call(state)).github.connected);

check('Timer rejects anonymous writes',(await call(timing,{id:'variables-2',elapsedMs:1000},null)).status===401);
check('Timer rejects unknown problem',(await call(timing,{id:'unknown',elapsedMs:1000})).status===400);
check('Timer rejects negative time',(await call(timing,{id:'variables-2',elapsedMs:-1})).status===400);
check('Timer rejects noninteger time',(await call(timing,{id:'variables-2',elapsedMs:1.5})).status===400);
let time=await call(timing,{id:'variables-2',elapsedMs:65000});check('Timer saves active time',time.timer.elapsedMs===65000);
check('Timer appears separately from drafts',(await call(state)).timers['variables-2'].elapsedMs===65000&&!Object.keys((await call(state)).records).some(k=>k.startsWith('timer:')));
check('Timer account isolation',!(await call(state,null,'other')).timers['variables-2']);
time=await call(timing,{id:'variables-2',elapsedMs:40000});check('Delayed writes cannot reduce elapsed time',time.timer.elapsedMs===65000);
time=await call(timing,{id:'variables-2',elapsedMs:68000,completed:true});check('Accepted completion time saved',time.timer.completedMs===68000);
time=await call(timing,{id:'variables-2',elapsedMs:72000,completed:true});check('First completion time retained',time.timer.elapsedMs===72000&&time.timer.completedMs===68000);
check('Unfinished problem cannot claim completion',(await call(timing,{id:'variables-code-01',elapsedMs:20000,completed:true})).status===400);
await call(state,{action:'draft',id:'variables-2',code,answer:'Draft after timer'});check('Saving code cannot overwrite time',(await call(state)).timers['variables-2'].elapsedMs===72000);
check('Timer cannot overwrite accepted code',(await call(state)).records['variables-2'].code===code);
check('Cross-origin timer blocked',(await timing.POST(new Request('https://test.invalid/api/time',{method:'POST',headers:{origin:'https://evil.invalid','oai-authenticated-user-id':'qa'},body:JSON.stringify({id:'variables-2',elapsedMs:80000})}))).status===403);
console.log(JSON.stringify({kind:'Route integration with in-memory SQLite and mocked external providers; real Java examples tested separately',passed:results.filter(x=>x.pass).length,total:results.length,failed:results.filter(x=>!x.pass)},null,2));
if(results.some(x=>!x.pass))process.exit(1);

fs.rmSync(dir,{recursive:true,force:true});
