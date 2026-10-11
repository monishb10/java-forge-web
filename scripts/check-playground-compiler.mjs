import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(root+'/package.json'),ts=require('typescript');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'java-forge-compiler-')),originalFetch=globalThis.fetch;
fs.writeFileSync(out+'/compiler.mjs',ts.transpileModule(fs.readFileSync(root+'/lib/compiler.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {runJava}=await import(out+'/compiler.mjs');
let details={},sentInput='',sentCode='',checks=0;
const check=(label,actual,expected)=>{assert.deepEqual(actual,expected,label);checks++};
globalThis.fetch=async(url,options)=>{
 if(String(url).includes('/create.json')){const body=new URLSearchParams(options.body);sentInput=body.get('input');sentCode=body.get('source_code');return Response.json({id:'compiler-test'})}
 return Response.json({status:'completed',build_result:'success',result:'success',exit_code:0,...details});
};
try{
 const code='public class Main { public static void main(String[] args) { System.out.println("hello"); } }',input='10 20\nname with spaces\n';
 details={stdout:'  10\n\n20  \n',stderr:'',exit_code:'0'};let result=await runJava(code,input);
 check('Preserve stdin including final newline',sentInput,input);check('Submit the exact Java source',sentCode,code);check('Preserve stdout spacing and newlines',result.output,details.stdout);check('Report actual success exit code',result.exitCode,0);check('Custom execution succeeds without expected output',result.status,'success');
 details={build_result:'failure',build_stderr:'Main.java:3: error: ; expected',exit_code:null};result=await runJava(code,'');check('Compile errors retain diagnostics',result.stderr,details.build_stderr);check('Compile errors remain distinct',result.status,'compile-error');check('Compile failure never claims a process exit code',result.exitCode,undefined);
 details={result:'failure',stdout:'Printed before failure\n',stderr:'java.lang.ArithmeticException: / by zero',exit_code:1};result=await runJava(code,'');check('Runtime errors keep partial stdout',result.output,details.stdout);check('Runtime failure has the real nonzero exit code',result.exitCode,1);check('Runtime errors remain distinct',result.status,'runtime-error');
 details={result:'timeout',stderr:'Time limit exceeded',exit_code:137};result=await runJava(code,'');check('Timeout is displayed as a timeout',result.status,'timeout');
 details={stdout:'',stderr:'',exit_code:0};result=await runJava(code,'');check('A program can successfully print nothing',result.output,'');check('An empty output is not a runtime failure',result.status,'success');
 details={stdout:'a'.repeat(60001),stderr:'b'.repeat(20001),exit_code:0};result=await runJava(code,'');check('Long output retains the supported limit',result.output.length,60000);check('Output truncation is explicit',result.outputTruncated,true);check('Diagnostic truncation is explicit',result.stderrTruncated,true);
 globalThis.fetch=async()=>new Response('Unavailable',{status:503});result=await runJava(code,'');check('Provider failure does not look like a completed program',result.status,'unavailable');check('Provider failure does not invent an exit code',result.exitCode,undefined);
 console.log(JSON.stringify({passed:checks,scope:'Playground compiler input, stdout, exit codes, compilation/runtime failures, timeouts and output limits',externalWrites:0}));
}finally{globalThis.fetch=originalFetch;fs.rmSync(out,{recursive:true,force:true})}
