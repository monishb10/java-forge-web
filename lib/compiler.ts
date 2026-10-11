export type CaseResult={input:string;expected?:string;output:string;stderr:string;status:string;time?:string;passed?:boolean;strictWhitespace?:boolean;exitCode?:number;outputTruncated?:boolean;stderrTruncated?:boolean};
export function normalizeOutput(s:string,strict=false){const value=s.replace(/\r\n/g,'\n');return strict?value.replace(/\n$/,''):value.split('\n').map(x=>x.trimEnd()).join('\n').trimEnd();}
async function request(path:string,params:Record<string,string>,method='GET'){
 const controller=new AbortController();const t=setTimeout(()=>controller.abort(),15000);
 try{const p=new URLSearchParams({...params,api_key:'guest'});const r=await fetch('https://api.paiza.io/runners/'+path+'.json'+(method==='GET'?'?'+p:''),{method,headers:method==='POST'?{'Content-Type':'application/x-www-form-urlencoded'}:undefined,body:method==='POST'?p.toString():undefined,signal:controller.signal});if(!r.ok)throw new Error('The compiler service is unavailable or rate-limited. Please try again shortly.');const d=await r.json() as any;if(d.error)throw new Error('The compiler service could not run this request. Please try again.');return d;}finally{clearTimeout(t)}
}
export async function runJava(code:string,input:string,expected?:string,strictWhitespace=false):Promise<CaseResult>{
 try{let d=await request('create',{source_code:code,language:'java',input},'POST');if(!d.id)throw new Error('The compiler did not return a run identifier.');const id=String(d.id);const deadline=Date.now()+25000;
 for(let i=0;i<24&&Date.now()<deadline;i++){d=await request('get_details',{id});if(d.status==='completed')break;await new Promise(r=>setTimeout(r,700));}
 if(d.status!=='completed')return{input,expected,output:'',stderr:'The compiler did not finish within the waiting period. Try again; no result has been accepted.',status:'timeout',passed:false};
 let status='success';if(d.build_result!=='success'&&d.build_result)status='compile-error';else if(d.result!=='success'||Number(d.exit_code)!==0)status=/timeout|time limit/i.test(String(d.stderr||'')+' '+d.result)?'timeout':'runtime-error';
 const output=String(d.stdout||'').slice(0,60000);const stderr=String(d.build_stderr||d.stderr||'').slice(0,20000);const passed=status==='success'&&(expected===undefined||normalizeOutput(output,strictWhitespace)===normalizeOutput(expected,strictWhitespace));if(status==='success'&&expected!==undefined&&!passed)status='wrong-answer';
 const exit= d.exit_code===null||d.exit_code===undefined||d.exit_code===''?undefined:Number(d.exit_code);
 return{input,expected,output,stderr,status,time:d.time,passed,strictWhitespace,exitCode:status!=='compile-error'&&Number.isSafeInteger(exit)?exit:undefined,outputTruncated:String(d.stdout||'').length>60000,stderrTruncated:String(d.build_stderr||d.stderr||'').length>20000};
 }catch(e){return{input,expected,output:'',stderr:e instanceof Error?e.message:'Compiler unavailable.',status:'unavailable',passed:false}}
}
