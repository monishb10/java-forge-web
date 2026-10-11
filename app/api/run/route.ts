import {body,db,failure,identity,json,mutation,ApiError} from '@/lib/server';
import {findExercise} from '@/lib/curriculum';
import {runJava} from '@/lib/compiler';

export async function POST(req:Request){try{
 mutation(req);const user=identity(req),b=await body(req);
 if(b.consent!==true)throw new ApiError('Allow code and test input to be sent to Paiza.IO before running.');
 if(typeof b.code!=='string'||b.code.length>60000||b.code.trim().length<10)throw new ApiError('Enter a Java program under 60,000 characters.');
 if(!['tests','samples','custom'].includes(b.mode))throw new ApiError('Choose custom input or supplied tests.');
 if(typeof b.input==='string'&&b.input.length>60000)throw new ApiError('Keep input under 60,000 characters.');
 const found=findExercise(b.exerciseId||'');
 if(b.mode!=='custom'&&!found?.exercise.tests)throw new ApiError('Choose a practice program to run its supplied tests.');
 const exercise=found?.exercise,suite=b.mode==='custom'?[]:b.mode==='samples'?exercise!.tests.slice(0,3):exercise!.tests;
 const testSuiteHash=b.mode==='tests'?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(suite.map(t=>[t.input,t.output,!!t.strictWhitespace])))))).map(x=>x.toString(16).padStart(2,'0')).join(''):undefined;
 const batching=b.mode==='tests'&&b.batch===true;
 let id=crypto.randomUUID() as string,cases:any[]=[],oldResult:string|null=null;
 if(b.runId!==undefined){
  if(!batching||typeof b.runId!=='string')throw new ApiError('Start a new test check.');
  const saved=await db().prepare('SELECT code,result FROM runs WHERE id=? AND user_id=? AND exercise_id=?').bind(b.runId,user,b.exerciseId).first<{code:string;result:string}>();
  if(!saved||saved.code!==b.code)throw new ApiError('This test check belongs to different code or another account. Start a new check.');
  const previous=JSON.parse(saved.result);
  if(previous.mode!=='tests'||previous.suiteVersion!==exercise!.suiteVersion||previous.testSuiteHash!==testSuiteHash||!Array.isArray(previous.cases)||previous.cases.length>suite.length||previous.cases.some((c:any,i:number)=>c.input!==suite[i].input||c.expected!==suite[i].output||!!c.strictWhitespace!==!!suite[i].strictWhitespace))throw new ApiError('The test cases have changed. Start a new check.');
  id=b.runId;cases=previous.cases;oldResult=saved.result;
  if(previous.complete===true)return json(previous);
 }
 const begin=cases.length,end=batching?Math.min(begin+3,suite.length):suite.length;
 if(b.mode==='custom')cases.push(await runJava(b.code,String(b.input||'')));
 else{
  let next=begin;
  await Promise.all(Array.from({length:Math.min(3,end-begin)},async()=>{while(next<end){const i=next++,t=suite[i];cases[i]={...await runJava(b.code,t.input,t.output,!!t.strictWhitespace),input:t.input,expected:t.output,strictWhitespace:!!t.strictWhitespace,label:t.label||'Case '+(i+1)};}}));
 }
 const complete=b.mode==='custom'||cases.length===suite.length;
 const result={id,cases,mode:b.mode,complete,total:b.mode==='custom'?1:suite.length,passed:b.mode==='tests'&&complete&&cases.every(c=>c.passed),testedCode:b.code,exerciseId:exercise?.id,suiteVersion:exercise?.suiteVersion||'recall-v1',testSuiteHash,createdAt:new Date().toISOString()};
 if(b.mode==='tests'){
  if(oldResult===null)await db().prepare('INSERT INTO runs(id,user_id,exercise_id,code,result,created_at) VALUES(?,?,?,?,?,?)').bind(id,user,b.exerciseId,b.code,JSON.stringify(result),Date.now()).run();
  else{
   // A delayed/concurrent response must never replace a later batch.
   await db().prepare('UPDATE runs SET result=? WHERE id=? AND user_id=? AND result=?').bind(JSON.stringify(result),id,user,oldResult).run();
   const stored=await db().prepare('SELECT result FROM runs WHERE id=? AND user_id=? AND exercise_id=?').bind(id,user,b.exerciseId).first<{result:string}>();
   if(!stored)throw new ApiError('This test check is unavailable. Start a new check.');
   return json(JSON.parse(stored.result));
  }
 }
 return json(result);
}catch(e){return failure(e)}}
