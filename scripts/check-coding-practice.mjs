// Content contract checks: a missing judging suite or mismatched sample can
// make a correct learner solution impossible to submit or understand.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(root+'/package.json'),ts=require('typescript');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'java-forge-bank-'));
let source=fs.readFileSync(root+'/lib/curriculum.ts','utf8');
source=source.replace(/import (\w+) from '(\.\/[^']+\.json)';/g,(_,name,ref)=>`const ${name}=${fs.readFileSync(path.resolve(root+'/lib',ref),'utf8')};`);
fs.writeFileSync(out+'/curriculum.mjs',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try{
 const {lessons,exercises,findExercise,editorDraft}=await import(pathToFileURL(out+'/curriculum.mjs'));
 assert.equal(lessons.length,20,'Only foundation topics in the current course');
 let count=0,cases=0;const ids=new Set();
 for(const l of lessons){
  const all=exercises(l);
  const rank={Easy:0,Medium:1,Hard:2};
  assert.ok(all.every((problem,index)=>index===0||rank[all[index-1].difficulty]<=rank[problem.difficulty]),`${l.id}: difficulty sections and Previous/Next share one easy-to-hard order`);
  assert.equal(all.length,32,`${l.id}: thirty-two problems are available`);
  assert.equal(new Set(all.map(e=>e.title.toLowerCase())).size,32,`${l.id}: distinct problem titles`);
  for(const e of all){
   assert.equal(e.kind,'code',`${e.id}: every practice exercise is a program`);
   assert.ok(e.tests?.length>=64,`${e.id}: at least sixty-four judged cases`);
   assert.ok(new Set(e.tests.map(t=>t.input)).size>=64,`${e.id}: sixty-four different inputs`);
   assert.ok(!ids.has(e.id),`${e.id}: unique saved-work identity`);ids.add(e.id);
   assert.ok(e.hint?.trim(),`${e.id}: an available hint must contain guidance`);
   assert.ok(e.suiteVersion,`${e.id}: versioned judging`);
   assert.equal(findExercise(e.id)?.lesson.id,l.id);
   assert.ok(e.task.length>25&&e.details?.input?.length&&e.details?.output,`${e.id}: complete contract`);
   for(const field of ['requirements','input','constraints','checks'])assert.ok(Array.isArray(e.details[field])&&e.details[field].every(s=>typeof s==='string'),`${e.id}: ${field} renders as a list`);
   assert.ok(!('_solution' in e),`${e.id}: reference solution is not sent to the editor`);
   assert.ok(e.details.constraints.length,`${e.id}: valid input limits`);
   assert.ok(e.details.examples.length>=2,`${e.id}: explained samples`);
   e.details.examples.forEach((sample,i)=>{
    assert.equal(sample.input,e.tests[i].input,`${e.id}: sample input matches runnable case`);
    assert.equal(sample.output,e.tests[i].output,`${e.id}: sample output matches judge`);
    assert.ok(sample.explanation.length>15,`${e.id}: explain the sample`);
   });
   for(const t of e.tests){assert.equal(typeof t.input,'string');assert.equal(typeof t.output,'string');assert.ok(t.input.length<=60000&&t.output.length<=60000,`${e.id}: compiler limits`)}
   cases+=e.tests.length;count++;
  }
 }
 assert.equal(count,640);
 assert.equal(findExercise('variables-3'),null,'Retired written responses do not become coding solutions');
 assert.ok(findExercise('variables-2'),'Existing main challenge identity is retained');
 const old='import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input, solve the problem, and print the result.\n        \n    }\n}\n';
 assert.equal(editorDraft(old),'','Untouched old templates no longer fill editors');
 assert.equal(editorDraft(undefined),'','New programs start blank');
 assert.equal(editorDraft(''),'','An intentionally cleared draft stays blank');
 const own='public class Main { public static void main(String[] args) { System.out.println(42); } }';
 assert.equal(editorDraft(own),own,'A learner’s saved solution is never removed automatically');
 assert.equal(editorDraft(undefined,own),own,'Explicit lesson examples can still open in Playground');
 console.log(JSON.stringify({topics:lessons.length,codingProblems:count,testCases:cases,minimumCases:64,blankEditor:true,status:'passed'}));
}finally{fs.rmSync(out,{recursive:true,force:true})}
