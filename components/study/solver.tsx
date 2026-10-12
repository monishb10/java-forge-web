'use client';
import React,{useEffect,useRef,useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {java} from '@codemirror/lang-java';
import {BookOpen,Check,CheckCircle2,Code2,ExternalLink,FileCode2,GitBranch,Lightbulb,LoaderCircle,Maximize2,Minimize2,Pause,Play,RotateCcw,Send,Terminal,XCircle,PanelRight,PanelBottom} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from '@/components/ui/alert-dialog';
import {ResizablePanelGroup,ResizablePanel,ResizableHandle} from '@/components/ui/resizable';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {toast} from 'sonner';
import {Exercise,TestCase,lessons,exercises,earlierExercises,isFoundationExercise} from '@/lib/curriculum';
import {api,useApp,useDraft,solved} from './shared';
import {Difficulty} from './learning';
import {CodingSessionControl} from './study-clock';
import PlaygroundTerminal from './playground-terminal';
const javaExtension=[java()];
type CaseResult={input:string;expected?:string;output:string;stderr:string;status:string;passed:boolean;label?:string;time?:string};
type Result={complete?:boolean;total?:number;exerciseId?:string;id:string;cases:CaseResult[];mode:string;passed:boolean;testedCode:string;createdAt:string};
let compilerConsent=false;
function useCompiler(){
 const[loading,setLoading]=useState(false),[result,setResult]=useState<Result|null>(null),[consent,setConsent]=useState(false),[operation,setOperation]=useState(''),[error,setError]=useState('');
 const pending=useRef<null|(()=>Promise<void>)>(null),stopping=useRef(false);const {runLock,study,view}=useApp();
 const run=async(mode:string,code:string,input:string,exerciseId?:string,after?:(r:Result)=>Promise<void>)=>{
  const perform=async()=>{
   if(runLock.current)return;runLock.current=true;stopping.current=false;setLoading(true);setError('');
   const previous=mode==='tests'&&result?.mode==='tests'&&result.testedCode===code&&result.exerciseId===exerciseId?result:null;
   setResult(previous);setOperation(mode==='tests'?'Starting the full test check…':mode==='samples'?'Running examples…':'Running your program…');
   try{
    let r:Result;
    if(previous?.passed&&previous.complete!==false)r=previous;
    else if(mode==='tests'){
     let runId=previous?.complete===false?previous.id:undefined;
     do{
      r=await api('/api/run',{mode,code,input,exerciseId,consent:true,batch:true,runId});setResult(r);runId=r.id;
      setOperation(`Checked ${r.cases.length} of ${r.total} tests · ${r.cases.filter(c=>c.passed).length} passed`);
     }while(r.complete===false&&!stopping.current);
    }else{r=await api('/api/run',{mode,code,input,exerciseId,consent:true});setResult(r)}
    if(r.complete!==false&&after)await after(r);
   }catch(e){setError((e as Error).message);toast.error((e as Error).message)}finally{setLoading(false);runLock.current=false}
  };
  if(!code.trim()){toast('Write your Java program before running it.');return}
  study.start(view==='playground'?'playground':'practice');if(!compilerConsent){pending.current=perform;setConsent(true)}else await perform();
 };
 const consentDialog=<Dialog open={consent} onOpenChange={setConsent}><DialogContent><DialogHeader><DialogTitle>Run Java in your browser</DialogTitle><DialogDescription>Your Java code and test input will be sent to Paiza.IO to compile and run. Don’t include passwords or personal information in your code.</DialogDescription></DialogHeader><p className="muted small">Allow this for this open tab. Your GitHub token is never sent to the compiler.</p><DialogFooter><button className="secondary" onClick={()=>setConsent(false)}>Cancel</button><button className="primary" onClick={()=>{compilerConsent=true;setConsent(false);pending.current?.();pending.current=null}}><Play size={15}/>Allow and run</button></DialogFooter></DialogContent></Dialog>;
 const clear=()=>{if(!runLock.current){setResult(null);setError('')}};
 const stop=()=>{stopping.current=true;setOperation('Stopping after the current batch…')};
 return{loading,result,run,clear,stop,operation,error,consentDialog};
}
function TextOutput({value,empty='(empty)'}:{value:string;empty?:string}){const[expanded,setExpanded]=useState(false);useEffect(()=>setExpanded(false),[value]);const long=value.length>1200;return <><pre>{value?(long&&!expanded?value.slice(0,1200)+'\n…':value):empty}</pre>{long&&<button className="text-button" onClick={()=>setExpanded(!expanded)}>{expanded?'Show less':`Show full value (${value.length.toLocaleString()} characters)`}</button>}</>}
function CaseFields({input,expected,output,stderr}:{input:string;expected?:string;output?:string;stderr?:string}){return <div className="case-fields"><div><span>Input</span><TextOutput value={input} empty="(no input)"/></div>{expected!==undefined&&<div><span>Expected output</span><TextOutput value={expected}/></div>}{output!==undefined&&<div><span>Your output</span><TextOutput value={output}/></div>}{stderr&&<div className="error-output"><span>Compiler message</span><TextOutput value={stderr}/></div>}</div>}
function TestConsole({tests,result,loading,operation,error,input,setInput,custom,setCustom,code,clear}:{clear?:()=>void;tests?:TestCase[];result:Result|null;loading:boolean;operation:string;error:string;input:string;setInput:(v:string)=>void;custom:boolean;setCustom:(v:boolean)=>void;code:string}){const{study,view}=useApp();const engage=()=>{if(!loading)study.start(view==='playground'?'playground':'practice')};const[tab,setTab]=useState('tests'),[test,setTest]=useState(0),[output,setOutput]=useState(0);useEffect(()=>{if(result){setTab('results');const firstFail=result.cases.findIndex(c=>!c.passed);setOutput(firstFail<0?0:firstFail)}},[result]);useEffect(()=>{if(loading)setTab('results')},[loading]);const passed=result?.cases.filter(c=>c.passed).length||0,r=result?.cases[output];return <Tabs value={tab} onValueChange={setTab} className="test-console" onPointerDownCapture={engage} onFocusCapture={engage} onKeyDownCapture={engage}><TabsList variant="line"><TabsTrigger value="tests"><Terminal size={15}/>{tests?'Test cases':'Input'} {tests&&<span className="count-pill">{tests.length}</span>}</TabsTrigger><TabsTrigger value="results"><CheckCircle2 size={15}/>Results{result&&!loading&&<span className={result.complete===false?'result-dot pending':passed===result.cases.length?'result-dot pass':'result-dot fail'}/>}</TabsTrigger></TabsList><TabsContent value="tests" className="console-body"><div className="case-tabs" aria-label="Choose test case">{tests&&<Select value={String(test)} onValueChange={value=>{setTest(Number(value));setCustom(false)}}><SelectTrigger aria-label="Choose test case"><SelectValue/></SelectTrigger><SelectContent>{tests.map((t,i)=><SelectItem key={i} value={String(i)}>Case {i+1} · {t.label||"Test input"}</SelectItem>)}</SelectContent></Select>}<button className={custom||!tests?'active':''} onClick={()=>setCustom(true)}>Custom input</button></div>{custom||!tests?<div><label className="field-label" htmlFor="custom-input">Standard input</label><textarea id="custom-input" value={input} onChange={e=>setInput(e.target.value)} rows={4} maxLength={60000} spellCheck={false} placeholder="Enter the values your program reads with Scanner…"/><p className="console-help">{tests?'Run uses this input. Submit always checks every supplied test.':'These values are sent to your program as standard input.'}</p></div>:<><p className="case-label">{tests[test]?.label}</p><CaseFields input={tests[test]?.input||''} expected={tests[test]?.output}/><p className="console-help">Run checks the first {Math.min(3,tests.length)} examples. Submit checks all {tests.length} cases.</p></>}</TabsContent><TabsContent value="results" className="console-body">{loading?<div className="console-empty"><LoaderCircle className="spin" size={24}/><b>{operation}</b><p>All supplied cases are checked in small batches. Your progress updates after each batch.</p></div>:error?<div className="run-error"><XCircle size={22}/><b>Could not run</b><p>{error}</p><p>Try again. This attempt has not been accepted.</p>{clear&&<button className="secondary" onClick={clear}>Reset test check</button>}</div>:!result?<div className="console-empty"><Terminal size={26}/><b>Your results will appear here</b><p>{tests?'Write your code, then choose Run to try the examples.':'Write your program, add any input it needs, then choose Run code.'}</p></div>:<><div className={'result-summary '+(result.complete===false?'pending':passed===result.cases.length?'pass':'fail')}>{result.complete===false?<Pause size={22}/>:passed===result.cases.length?<CheckCircle2 size={22}/>:<XCircle size={22}/>}<div><h3>{result.complete===false?'Test check paused':result.mode==='custom'?(r?.passed?'Program finished':statusName(r?.status)):passed===result.cases.length?(result.mode==='tests'?'All tests passed':'Examples passed'):statusName(result.cases.find(c=>!c.passed)?.status)}</h3><p>{result.mode==='custom'?'Custom input · output is not judged':`${passed} / ${result.total||result.cases.length} tests passed${result.mode==='samples'?' · submit to check the full suite':''}`}</p></div></div>{result.complete===false&&<p className="stale-result">Checked {result.cases.length} of {result.total} tests. Choose Submit to continue this check with unchanged code. {clear&&<button className="text-button" onClick={clear}>Reset test check</button>}</p>}{code!==result.testedCode&&<p className="stale-result">Your code has changed. Run it again to check this version.</p>}<div className="case-tabs result-case-tabs">{<Select value={String(output)} onValueChange={value=>setOutput(Number(value))}><SelectTrigger aria-label="Choose test result"><SelectValue/></SelectTrigger><SelectContent>{result.cases.map((c,i)=><SelectItem key={i} value={String(i)}>Case {i+1} · {c.passed?"Passed":statusName(c.status)}</SelectItem>)}</SelectContent></Select>}</div>{r&&<><p className="case-label">{r.label||'Custom input'}</p><CaseFields input={r.input} expected={r.expected} output={r.output} stderr={r.stderr}/>{!r.passed&&<p className="debug-help"><Lightbulb size={15}/>{r.status==='wrong-answer'?'Compare the expected and actual output. Trace this input one line at a time, then check spacing, boundaries, and numeric types.':r.status==='compile-error'?'Check the compiler message for a line number. Check brackets, semicolons, and the Main class name.':r.status==='unavailable'?'The external compiler is unavailable. Retry shortly; no failed solve is recorded.':'Check the error message, array bounds, division by zero, and loop conditions.'}</p>}</>}</>}</TabsContent></Tabs>}
function statusName(s?:string){return ({'wrong-answer':'Wrong answer','compile-error':'Compilation error','runtime-error':'Runtime error',timeout:'Time limit reached',unavailable:'Compiler unavailable'} as Record<string,string>)[s||'']||'Check the result'}
export function Editor({code,setCode,loading,savedLabel,onReset}:{code:string;setCode:(x:string)=>void;loading:boolean;savedLabel:string;onReset:()=>void}){
 const {study,view}=useApp();const engage=()=>{if(!loading)study.start(view==='playground'?'playground':'practice')};
 return <div className="code-editor"><div className="editor-toolbar"><span><FileCode2 size={15}/>Main.java <b>Java</b></span><div><small>{savedLabel}</small><CodingSessionControl disabled={loading}/><button className="text-button clear-editor" aria-label="Start from scratch" title="Start from scratch" disabled={loading} onClick={onReset}><RotateCcw size={15}/><span>Start from scratch</span></button></div></div><div className="compiler-interaction" onPointerDownCapture={engage} onFocusCapture={engage} onKeyDownCapture={engage} onPasteCapture={engage}><CodeMirror value={code} onChange={value=>{engage();setCode(value)}} placeholder="Write your Java program here, starting from the first line…" extensions={javaExtension} theme="light" editable={!loading} height="100%" basicSetup={{lineNumbers:true,foldGutter:true,highlightActiveLine:true,autocompletion:true,tabSize:4}} indentWithTab aria-label="Java code editor"/></div><div className="editor-footnote"><span>Use <code>public class Main</code></span><span>Daily time is in Tracker</span></div></div>
}
function ResetDialog({open,onOpenChange,reset}:{open:boolean;onOpenChange:(x:boolean)=>void;reset:()=>void}){return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Start from a blank editor?</AlertDialogTitle><AlertDialogDescription>This clears your current code and saves a blank draft for this exercise. Copy any work you want to keep first. Your GitHub file and recorded daily study time stay saved.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep my code</AlertDialogCancel><button className="primary" onClick={()=>{reset();onOpenChange(false)}}>Clear editor</button></AlertDialogFooter></AlertDialogContent></AlertDialog>}

export function Solver({exercise:e}:{exercise:Exercise}){
 const {data,lesson:l,ready,navigate,updateRecord,refreshActivity,study}=useApp();
 const draft=useDraft(e.id,''),compiler=useCompiler();
 const [custom,setCustom]=useState(false),[input,setInput]=useState(e.tests[0]?.input||''),[reset,setReset]=useState(false);
 const [leftTab,setLeftTab]=useState('description'),[mobileTab,setMobileTab]=useState('problem'),[savingGithub,setSavingGithub]=useState(false),[mobile,setMobile]=useState(false);
 useEffect(()=>{const m=matchMedia('(max-width: 900px)');const change=()=>setMobile(m.matches);change();m.addEventListener('change',change);return()=>m.removeEventListener('change',change)},[]);
 const accepted=solved(draft.record,e)&&draft.code===draft.record.code;
 const index=lessons.indexOf(l),legacy=!isFoundationExercise(e.id),topicExercises=legacy?earlierExercises(l):exercises(l),problemIndex=topicExercises.findIndex(x=>x.id===e.id);
 const busy=compiler.loading||draft.completing;
 const run=(submit=false)=>{
  setMobileTab('code');
  compiler.run(submit?'tests':custom?'custom':'samples',draft.code,input,e.id,submit?async result=>{
   if(result.passed){study.pause();if(await draft.save('submit',result.id))toast.success(`Accepted · ${e.tests.length} tests passed`);}
  }:undefined);
 };
 const saveGithub=async()=>{
  if(!data.github.connected){navigate('settings');return}
  setSavingGithub(true);
  try{const r=await api('/api/github',{action:'save',id:e.id});updateRecord(e.id,r.record);void refreshActivity();toast.success(r.unchanged?'This problem is already on GitHub.':'Completed program saved to GitHub.')}
  catch(err){toast.error((err as Error).message)}finally{setSavingGithub(false)}
 };
 const githubSaved=draft.record.githubStatus==='saved'&&draft.record.githubRepo?.toLowerCase()===data.github.repo?.toLowerCase();
 const description=<div className="problem-pane">
  <Tabs value={leftTab} onValueChange={setLeftTab}>
   <TabsList variant="line"><TabsTrigger value="description"><BookOpen size={15}/>Problem</TabsTrigger><TabsTrigger value="hints"><Lightbulb size={15}/>Hint</TabsTrigger></TabsList>
   <TabsContent value="description" className="problem-content">
    <div className="problem-heading"><span className="eyebrow">{legacy?'EARLIER PRACTICE':`TOPIC ${index+1}`} · {l.title}</span><p className="problem-position">Program {problemIndex+1} of {topicExercises.length} in this topic</p><h1>{problemIndex+1}. {e.title}</h1><div className="problem-tags"><Difficulty value={e.difficulty}/><span>{e.tests.length} test cases</span>{accepted&&<span className="solved-badge"><CheckCircle2 size={14}/>Solved</span>}</div></div>
    <div className="problem-skills"><b>{legacy?"Saved from your earlier course":"Concepts you will use"}</b><span>{e.skills?.join(" · ")||l.title}</span></div><h2>Your task</h2><p className="problem-statement">{e.task}</p>
    {e.details.requirements.length>0&&<section className="problem-section"><h2>Requirements</h2><ul className="problem-rules">{e.details.requirements.map((r,i)=><li key={i}>{r}</li>)}</ul></section>}
    <section className="problem-section"><h2>Input</h2><ul className="problem-rules">{e.details.input.map((r,i)=><li key={i}>{r}</li>)}</ul></section>
    <section className="problem-section"><h2>Output</h2><p>{e.details.output}</p></section>
    {e.details.examples.map((t,i)=><section className="problem-example" key={i}><h3>Example {i+1}</h3><CaseFields input={t.input} expected={t.output}/><div className="example-explanation"><b>Why this result?</b><p>{t.explanation}</p></div></section>)}
    <section className="problem-section"><h2>Constraints</h2><ul className="problem-rules">{e.details.constraints.map((r,i)=><li key={i}>{r}</li>)}</ul></section>
    <button className="text-button" onClick={()=>navigate('learn',l.id)}><BookOpen size={15}/>{index>=0?'Open this topic’s lesson':'Open foundation lessons'}</button>
    <div className="problem-sequence-nav">{problemIndex>0&&<button className="secondary" onClick={()=>navigate('practice',l.id,topicExercises[problemIndex-1].id)}>Previous program</button>}{problemIndex<topicExercises.length-1&&<button className="secondary" onClick={()=>navigate('practice',l.id,topicExercises[problemIndex+1].id)}>Next: program {problemIndex+2}</button>}</div>
   </TabsContent>
   <TabsContent value="hints" className="problem-content"><h2>Need a starting point?</h2><p className="muted">Try one example by hand before opening the hint.</p>{draft.hint?<div className="hint-box">{e.hint}</div>:<button className="secondary" onClick={draft.reveal}><Lightbulb size={15}/>Show an approach hint</button>}</TabsContent>
  </Tabs>
  {accepted&&<div className="accepted-actions"><div><CheckCircle2 size={20}/><b>Accepted — well done!</b></div><p>Your program passed all {e.tests.length} supplied tests.</p>
   {githubSaved?<p className="github-save-status"><GitBranch size={15}/>Saved to GitHub · one commit per completed problem</p>:<><p className={draft.record.githubError?'github-save-error':'github-save-status'}>{data.github.connected?(draft.record.githubRepo===data.github.repo&&draft.record.githubError?draft.record.githubError:'New completions save automatically. You can save this completed program below.'):'Connect GitHub in Settings to save completed programs automatically.'}</p><button className="secondary" onClick={saveGithub} disabled={savingGithub}><GitBranch size={15}/>{savingGithub?'Saving…':data.github.connected?(draft.record.githubError?'Retry GitHub save':'Save completion to GitHub'):'Connect GitHub to save'}</button></>}
   {githubSaved&&draft.record.githubUrl&&<a className="text-button" href={draft.record.githubCommitUrl||draft.record.githubUrl} target="_blank" rel="noreferrer">{draft.record.githubCommitUrl?'View GitHub commit':'View saved program'} <ExternalLink size={13}/></a>}
   <button className="primary" onClick={()=>navigate('practice',l.id)}>Back to foundation practice</button>
  </div>}
  {draft.record.status==='accepted'&&!accepted&&<p className="old-solve-note">Previously solved. Submit this version to check the current tests.</p>}
 </div>;
 const editorPanel=<Editor code={draft.code} setCode={draft.setCode} loading={busy||!ready} savedLabel={draft.savedLabel} onReset={()=>setReset(true)}/>;
 const resultsPanel=<TestConsole {...compiler} tests={e.tests} input={input} setInput={setInput} custom={custom} setCustom={setCustom} code={draft.code}/>;
 const codePanel=<div className="editor-and-results">{mobile?<>{editorPanel}{resultsPanel}</>:<ResizablePanelGroup orientation="vertical" aria-label="Editor and test results"><ResizablePanel defaultSize="66%" minSize="30%">{editorPanel}</ResizablePanel><ResizableHandle withHandle className="console-resize-handle"/><ResizablePanel defaultSize="34%" minSize="20%">{resultsPanel}</ResizablePanel></ResizablePanelGroup>}</div>;
 return <div className="solver">
  <div className="solver-toolbar"><div className="solver-breadcrumb"><button onClick={()=>navigate('practice',l.id)}>Practice</button><span className="breadcrumb-divider">/</span><span>{l.title}</span></div><div className="run-actions"><>{compiler.loading&&<button className="secondary" onClick={compiler.stop}>Stop checks</button>}</><button className="secondary run-button" onClick={()=>run(false)} disabled={!ready||busy||!draft.code.trim()}>{busy?<LoaderCircle className="spin" size={16}/>:<Play size={16}/>}Run</button><button className="primary submit-button" onClick={()=>run(true)} disabled={!ready||busy||!draft.code.trim()}><Send size={15}/>{busy?'Checking…':'Submit'}<span>all {e.tests.length} tests</span></button></div></div>
  <div className="solver-mobile-tabs"><button className={mobileTab==='problem'?'active':''} onClick={()=>setMobileTab('problem')}><BookOpen size={16}/>Problem</button><button className={mobileTab==='code'?'active':''} onClick={()=>setMobileTab('code')}><Code2 size={16}/>Code & results</button></div>
  <div className="solver-panels">{mobile?(mobileTab==='problem'?description:codePanel):<ResizablePanelGroup orientation="horizontal"><ResizablePanel defaultSize="43%" minSize="28%">{description}</ResizablePanel><ResizableHandle withHandle/><ResizablePanel defaultSize="57%" minSize="35%">{codePanel}</ResizablePanel></ResizablePanelGroup>}</div>
  {compiler.consentDialog}<ResetDialog open={reset} onOpenChange={setReset} reset={()=>draft.setCode('')}/>
 </div>;
}

export function Playground(){
 const {ready,exampleDraft,navigate,lesson,study}=useApp();
 const [provided]=useState(()=>exampleDraft.current);
 useEffect(()=>{exampleDraft.current=null},[exampleDraft]);
 const draft=useDraft('playground',provided||'',!!provided),compiler=useCompiler();
 const [input,setInput]=useState(''),[reset,setReset]=useState(false),[expanded,setExpanded]=useState(false),[mobile,setMobile]=useState(false),[dock,setDock]=useState<'right'|'bottom'>('right');
 useEffect(()=>{try{const saved=localStorage.getItem('java-forge:terminal-position');if(saved==='right'||saved==='bottom')setDock(saved)}catch{/* Layout preferences are optional. */}},[]);
 const changeDock=(value:string)=>{if(value!=='right'&&value!=='bottom')return;setDock(value);try{localStorage.setItem('java-forge:terminal-position',value)}catch{/* Keep the selected layout for this visit. */}};

 useEffect(()=>{const m=matchMedia('(max-width: 900px)');const change=()=>setMobile(m.matches);change();m.addEventListener('change',change);const full=()=>setExpanded(document.fullscreenElement===document.documentElement);document.addEventListener('fullscreenchange',full);return()=>{m.removeEventListener('change',change);document.removeEventListener('fullscreenchange',full)}},[]);
 const expand=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('Full screen is unavailable in this browser. The editor already uses the page width.')}};
 const editor=<Editor code={draft.code} setCode={draft.setCode} loading={compiler.loading||!ready} savedLabel={draft.savedLabel} onReset={()=>setReset(true)}/>;
 const run=()=>{if(ready&&!compiler.loading&&draft.code.trim())void compiler.run('custom',draft.code,input)};
 const console=<PlaygroundTerminal {...compiler} input={input} setInput={setInput} code={draft.code} onClear={compiler.clear} disabled={!ready||compiler.loading} onEngage={()=>{if(ready&&!compiler.loading)study.start('playground')}}/>;
 return <div className={'playground-workspace dock-'+(mobile?'bottom':dock)} onKeyDownCapture={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();run()}}}>
  <div className="playground-toolbar"><div><span className="eyebrow">THE CODING DESK</span><h1>JAVA PLAYGROUND.</h1><p><kbd>Ctrl / ⌘ + Enter</kbd> to run</p></div><div className="run-actions"><div className="terminal-dock-control"><Select value={dock} onValueChange={changeDock}><SelectTrigger aria-label="Terminal position">{dock==='right'?<PanelRight size={16}/>:<PanelBottom size={16}/>}<SelectValue/></SelectTrigger><SelectContent><SelectItem value="right">Terminal right</SelectItem><SelectItem value="bottom">Terminal bottom</SelectItem></SelectContent></Select></div><button className="secondary playground-fullscreen" onClick={expand} aria-label={expanded?'Exit full screen':'Enter full screen'}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}<span>{expanded?'Exit full screen':'Full screen'}</span></button><button className="primary" disabled={!ready||compiler.loading||!draft.code.trim()} onClick={run}>{compiler.loading?<LoaderCircle className="spin" size={17}/>:<Play size={17}/>}Run code</button></div></div>
  {provided&&<div className="example-loaded"><CheckCircle2 size={16}/>Example opened from {lesson.title}.<button className="text-button" onClick={()=>navigate('learn',lesson.id)}>Back to lesson</button></div>}
  <div className="playground-panels terminal-layout">{mobile?<>{editor}{console}</>:<ResizablePanelGroup orientation={dock==='right'?'horizontal':'vertical'}><ResizablePanel defaultSize="66%" minSize="35%">{editor}</ResizablePanel><ResizableHandle withHandle className="playground-drag-handle"/><ResizablePanel defaultSize="34%" minSize={dock==='right'?'28%':'25%'}>{console}</ResizablePanel></ResizablePanelGroup>}</div>
  <div className="playground-statusbar"><span><b>Java</b><span>{draft.code.split('\n').length} {draft.code.includes('\n')?'lines':'line'}</span></span><p className="playground-save-note">Playground runs do not submit a practice problem.</p></div>
  {compiler.consentDialog}<ResetDialog open={reset} onOpenChange={setReset} reset={()=>draft.setCode('')}/>
 </div>;
}
