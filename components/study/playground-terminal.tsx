'use client';
import React,{useEffect,useRef,useState} from 'react';
import {Check,Copy,LoaderCircle,Terminal,Trash2,WrapText} from 'lucide-react';
import {toast} from 'sonner';
import type {CaseResult} from '@/lib/compiler';

export type TerminalRun={id:string;testedCode:string;cases:CaseResult[]};
type OutputProps={result:TerminalRun|null;loading:boolean;error:string;code:string;input:string};
const labels:Record<string,string>={success:'Program finished','compile-error':'Compilation error','runtime-error':'Runtime error',timeout:'Time limit reached',unavailable:'Compiler unavailable'};

/** Render the compiler's real stdout/stderr as text, with no judging or fabricated prompts. */
export function TerminalOutput({result,loading,error,code,input}:OutputProps){
 const run=result?.cases[0];
 if(loading)return <div className="terminal-running"><LoaderCircle size={16} className="spin"/><span>Compiling and running Main.java…</span></div>;
 if(error)return <><p className="terminal-meta terminal-failure">Could not run Main.java</p><pre className="terminal-stderr">{error}</pre><p className="terminal-meta">Choose Run code to try again.</p></>;
 if(!run)return <div className="terminal-empty"><p>Ready to run Main.java.</p><p>Write your code, add input if needed, then choose Run code.</p></div>;
 const stale=code!==result!.testedCode||input!==run.input;
 return <>
  <p className="terminal-command"><span aria-hidden="true">›</span> Main.java</p>
  {stale&&<p className="terminal-stale">Code or input has changed. Run again to see the new result.</p>}
  {run.output!==''&&<pre className="terminal-stdout" aria-label="Standard output">{run.output}</pre>}
  {run.stderr!==''&&<div className="terminal-error-block"><span>Compiler / runtime message</span><pre className="terminal-stderr" aria-label="Compiler or runtime errors">{run.stderr}</pre></div>}
  {run.outputTruncated&&<p className="terminal-meta">Output was limited to 60,000 characters.</p>}
  {run.stderrTruncated&&<p className="terminal-meta">Compiler messages were limited to 20,000 characters.</p>}
  {run.status==='success'&&!run.output&&!run.stderr&&<p className="terminal-meta">Program finished without printing output.</p>}
  {/NoSuchElementException/.test(run.stderr)&&<p className="terminal-input-help">Your program asked for more input. Add all the values it reads in Program input, then run again.</p>}
  {/InputMismatchException/.test(run.stderr)&&<p className="terminal-input-help">One input value has the wrong type. Check that each value matches the Scanner method reading it.</p>}
  <p className={'terminal-exit '+(run.status==='success'?'terminal-success':'terminal-failure')}>{run.exitCode!==undefined&&run.status!=='compile-error'?`Process exited with code ${run.exitCode}.`:labels[run.status]||'Run finished.'}</p>
 </>;
}

export default function PlaygroundTerminal(props:OutputProps&{setInput:(value:string)=>void;onClear:()=>void;onEngage:()=>void;disabled:boolean}){
 const {result,loading,error,code,input,setInput,onClear,onEngage,disabled}=props;
 const [wrap,setWrap]=useState(false),[copied,setCopied]=useState(false);
 const viewport=useRef<HTMLDivElement>(null),copyReset=useRef<ReturnType<typeof setTimeout>|null>(null);
 const run=result?.cases[0],status=loading?'Running…':error?'Run unavailable':run?(labels[run.status]||'Finished'):'Ready';
 const text=error||[run?.output,run?.stderr].filter(v=>!!v).join('\n');
 useEffect(()=>{viewport.current?.scrollTo({top:0});setCopied(false)},[result,error,loading]);
 useEffect(()=>()=>{if(copyReset.current)clearTimeout(copyReset.current)},[]);
 const copy=async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);if(copyReset.current)clearTimeout(copyReset.current);copyReset.current=setTimeout(()=>setCopied(false),1800)}catch{toast.error('Could not copy. Select the terminal text and copy it manually.')}};
 return <div className="playground-console" onPointerDownCapture={onEngage} onFocusCapture={onEngage} onKeyDownCapture={onEngage}>
  <section className="program-input-pane" aria-labelledby="program-input-title">
   <div className="program-input-heading"><label id="program-input-title" htmlFor="playground-input">Program input</label><span>stdin</span><button type="button" disabled={disabled||!input} onClick={()=>setInput('')} title="Clear input" aria-label="Clear input"><Trash2 size={15}/></button></div>
   <textarea id="playground-input" value={input} onChange={e=>{onEngage();setInput(e.target.value)}} disabled={disabled} maxLength={60000} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder={'Enter values for Scanner here.\nExample: two integers\n10 20'} aria-describedby="playground-input-help"/>
   <p id="playground-input-help">Enter all input before Run code. Press Enter for a new line. Leave blank if your program does not read input.</p>
  </section>
  <section className={'playground-terminal '+(wrap?'wrap-output':'')} aria-label="Java terminal">
   <div className="terminal-toolbar"><h2><Terminal size={17}/>Terminal</h2><span className={'terminal-state '+(loading?'busy':error||run&&run.status!=='success'?'failed':'')} role="status" aria-live="polite">{status}</span><div className="terminal-actions"><button type="button" aria-label="Wrap output lines" title="Wrap output lines" aria-pressed={wrap} onClick={()=>setWrap(!wrap)}><WrapText size={16}/></button><button type="button" aria-label={copied?'Output copied':'Copy output'} title={copied?'Copied':'Copy output'} disabled={!text||loading} onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>}</button><button type="button" aria-label="Clear output" title="Clear output" disabled={loading||(!result&&!error)} onClick={onClear}><Trash2 size={16}/><span>Clear</span></button></div></div>
   <div ref={viewport} className="terminal-viewport" tabIndex={0} role="region" aria-label="Program output"><TerminalOutput result={result} loading={loading} error={error} code={code} input={input}/></div>
   <div className="terminal-footer"><span>Java output</span><span>Shown after execution</span></div>
  </section>
 </div>;
}
