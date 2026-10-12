import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'java-forge-ui-'));
const require=createRequire(root+'/package.json'),ts=require('typescript');
fs.mkdirSync(out,{recursive:true});if(!fs.existsSync(out+'/node_modules'))fs.symlinkSync(root+'/node_modules',out+'/node_modules');
const visited=new Set();
function compile(file){if(visited.has(file))return;visited.add(file);let source=fs.readFileSync(file,'utf8');const dest=out+'/'+path.relative(root,file).replace(/\.tsx?$/,'.mjs');fs.mkdirSync(path.dirname(dest),{recursive:true});
source=source.replace(/from\s+(['"])([^'"]+)\1/g,(match,quote,ref)=>{if(!ref.startsWith('@/')&&!ref.startsWith('.'))return match;let target=ref.startsWith('@/')?root+'/'+ref.slice(2):path.resolve(path.dirname(file),ref);if(target.endsWith('.json')){const copied=out+'/'+path.relative(root,target);fs.mkdirSync(path.dirname(copied),{recursive:true});fs.copyFileSync(target,copied);return 'from '+JSON.stringify('./'+path.relative(path.dirname(dest),copied))+' with {type:"json"}'}target=['.tsx','.ts'].map(x=>target+x).find(x=>fs.existsSync(x))||target;compile(target);const compiled=out+'/'+path.relative(root,target).replace(/\.tsx?$/,'.mjs');return 'from '+JSON.stringify('./'+path.relative(path.dirname(dest),compiled));});
fs.writeFileSync(dest,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);}
compile(root+'/components/study/learning.tsx');compile(root+'/components/study/progress.tsx');compile(root+'/components/study/practice-timer.tsx');compile(root+'/components/study/solver.tsx');compile(root+'/components/study/tracker.tsx');
const React=require('react'),{renderToString}=require('react-dom/server');
const renderWarnings=[],originalError=console.error;console.error=(...args)=>{renderWarnings.push(args.join(' '));originalError(...args)};
const ui=await import(out+'/components/study/learning.mjs'),{AppContext}=await import(out+'/components/study/shared.mjs'),{lessons,exercises,findExercise}=await import(out+'/lib/curriculum.mjs');
const defaultCtx={lessonStages:{current:{}},study:{running:false,kind:null,snapshot:null,pending:[],error:false,start:()=>{},pause:()=>{},flush:async()=>true},refreshActivity:async()=>{},data:{records:{},topics:{},timers:{},github:{},activity:{sessions:[],events:[],commits:[]}},ready:true,view:'practice',navigate:async()=>true,saveTopic:async()=>true,updateRecord:()=>{},guard:{current:null},runLock:{current:false},exampleDraft:{current:null}};
const {lessonVisuals}=await import(out+'/lib/lesson-visuals.mjs');
const {LessonFrame}=await import(out+'/components/study/lesson-visual.mjs');
const photos=JSON.parse(fs.readFileSync(root+'/lib/lesson-photos.json','utf8'));
assert.ok(lessons.every(l=>lessonVisuals[l.id]),'Every active lesson needs its own visual explanation');
let frameCount=0;
let checked=0;
for(const lesson of lessons){
 const ctx={...defaultCtx,lesson};
 const render=component=>renderToString(React.createElement(AppContext.Provider,{value:ctx},React.createElement(component)));
 const practice=render(ui.ProblemLibrary);assert.equal((practice.match(/class="topic-problem-row"/g)||[]).length,32,lesson.id);assert.equal((practice.match(/class="question-number"/g)||[]).length,32,lesson.id);assert.ok(practice.includes('Start with Easy programs.'));assert.ok(!practice.includes('Thinking'));assert.ok(!practice.includes('Compare your answer'));assert.ok(practice.replace(/<!--.*?-->/g,'').includes('32 programs'));
 const learn=render(ui.LessonPage);assert.ok(learn.includes('What does this mean?'));assert.ok(learn.includes('Three words to know'));assert.ok(learn.includes('See the example'));assert.ok(learn.includes('Read the code'));assert.ok(learn.includes('Check understanding'));assert.ok(learn.includes('Watch a video'));assert.ok(!learn.includes('32 programs'));assert.ok(learn.includes('What to learn in this topic'));assert.ok(learn.includes('Ready to move on when:'));assert.ok(!learn.includes('topic-problem-row'));assert.ok(!learn.includes('practice-timer'));assert.equal(exercises(lesson).length,32);checked++;
 const visual=lessonVisuals[lesson.id],photo=photos[visual.photo];
 for(const stage of ['example','code','try']){const staged=renderToString(React.createElement(AppContext.Provider,{value:{...ctx,lessonStages:{current:{[lesson.id]:stage}}}},React.createElement(ui.LessonPage)));if(stage==='example'){assert.ok(staged.includes(photo.src));assert.ok(staged.includes('Next step'))}if(stage==='code'){assert.ok(staged.includes('Main.java'));assert.ok(staged.includes('What this program prints'))}if(stage==='try'){assert.ok(staged.includes('Mark studied today'));assert.ok(staged.includes('I understand this concept'));assert.ok(staged.includes('Try in Playground'))}}
 assert.ok(photo,lesson.id+' photo');assert.ok(fs.statSync(root+'/public'+photo.src).size>5000);assert.ok(photo.alt.length>20);assert.ok(photo.sourcePage.startsWith('https://www.pexels.com/'));assert.ok(photo.width>=900&&photo.height>=500);
 assert.equal(visual.connections.length,3);assert.ok(visual.frames.length>=3);const visualUI=await import(out+'/components/study/lesson-visual.mjs');const photoHTML=renderToString(React.createElement(visualUI.LessonPhotoStory,{topic:lesson.id,situation:'Example situation'}));assert.ok(photoHTML.includes(photo.src));const walkHTML=renderToString(React.createElement(visualUI.LessonVisualWalkthrough,{topic:lesson.id}));assert.ok(walkHTML.includes('Next step'));assert.ok(walkHTML.includes('aria-current="step"'));assert.ok(walkHTML.includes('aria-live="polite"'));
 assert.equal(new Set(visual.frames.map(f=>f.title)).size,visual.frames.length,lesson.id+' unique step titles');
 for(const frame of visual.frames){
  assert.ok(frame.text.length>20&&frame.code.length>3&&frame.rows.length>0,lesson.id+' complete step');
  for(const row of frame.rows){assert.ok(row.label);for(const cell of row.cells){assert.equal(typeof cell.value,'string');assert.equal(typeof cell.label,'string')}}
  if(frame.network){const nodes=new Set(frame.network.nodes.map(n=>n.id));assert.equal(nodes.size,frame.network.nodes.length);for(const [from,to] of frame.network.edges){assert.ok(nodes.has(from)&&nodes.has(to)&&from!==to)}}
  const markup=renderToString(React.createElement(LessonFrame,{frame}));assert.ok(markup.includes('Java behind this step'));assert.ok(!markup.includes('NaN'));assert.ok(!markup.includes('undefined'));if(frame.network){assert.ok(markup.includes('role="img"'));assert.ok(markup.includes('<title'));assert.ok(!markup.includes('<title></title>'))}frameCount++;
 }
}
console.log(JSON.stringify({topicsRendered:checked,problemsPerTopic:32,totalExercises:checked*32,lessonGuidesRendered:checked,status:'passed',scope:'Server-rendered content and grouping checks; not visual browser QA'}));
console.log(JSON.stringify({visualLessonCoverage:checked,stepFramesRendered:frameCount,photosVerified:Object.keys(photos).length,status:'passed'}));

const {learningTopics}=await import(out+'/lib/lesson-roadmap.mjs');
const {learningStages,learningTopicIds}=await import(out+'/lib/curriculum.mjs');
assert.equal(learningStages.length,18);
assert.equal(learningTopics.length,29);
assert.equal(new Set(learningTopicIds).size,29);
assert.ok(lessons.every(l=>learningTopicIds.includes(l.id)),'Every existing practice lesson remains in the learning path');
for(const topic of learningTopics){
 for(const step of ['idea','example','code','video','check']){
  const markup=renderToString(React.createElement(AppContext.Provider,{value:{...defaultCtx,lesson:lessons[0],lessonStages:{current:{[topic.id]:step}}}},React.createElement(ui.LessonPage,{topicId:topic.id})));
  assert.ok(!markup.includes('topic-problem-row'));
  assert.ok(!markup.includes('undefined'));
  if(step==='idea')assert.ok(markup.includes('What to learn in this topic'));
  if(step==='code')assert.ok(markup.includes('Main.java')&&markup.includes('What this program prints'));
  if(step==='check')assert.ok(markup.includes('Mark studied today')&&markup.includes('Reveal the explanation'));
  if(step==='video')for(const video of topic.videos){
   const url=new URL(video.url);assert.ok(['www.geeksforgeeks.org','www.youtube.com'].includes(url.hostname));
   assert.ok(markup.includes(video.url.replaceAll('&','&amp;'))&&markup.includes('target="_blank"'));
  }
 }
 if(topic.trace)assert.ok(topic.trace.rows.every(row=>row.length===topic.trace.columns.length));
}
console.log('All 29 roadmap lessons rendered across 5 steps, with 18 ordered stages and safe video links.');

const legacy=findExercise('variables-2');
assert.ok(legacy,'Earlier exercise remains addressable');
const archived=renderToString(React.createElement(AppContext.Provider,{value:{...defaultCtx,lesson:lessons[0],data:{...defaultCtx.data,records:{'variables-2':{code:'my saved code',status:'accepted',suiteVersion:legacy.exercise.suiteVersion}}}}},React.createElement(ui.ProblemLibrary)));
assert.ok(archived.includes('Earlier saved practice'));assert.ok(archived.includes(legacy.exercise.title));assert.ok(archived.includes('Completed'));
const Dashboard=(await import(out+'/components/study/progress.mjs')).default;
const html=renderToString(React.createElement(AppContext.Provider,{value:{...defaultCtx,lesson:lessons[0]}},React.createElement(Dashboard)));
assert.ok(html.includes('Java foundations'));assert.ok(html.includes('Open daily tracker'));assert.ok(!html.includes('Time spent'));assert.ok(html.includes('Connect GitHub'));
assert.equal((html.match(/class="roadmap-dashboard-stage\b[^"]*"/g)||[]).length,18,'Dashboard exposes all 18 learning stages');
const {PracticeClock,formatTimer}=await import(out+'/lib/practice-clock.mjs');
const clock=new PracticeClock(2000);clock.resume(1000);assert.equal(clock.total(6000),7000);clock.pause(6000);assert.equal(clock.total(999000),7000);clock.resume(1000000);clock.resume(1005000);assert.equal(clock.pause(1008000),15000);assert.equal(clock.total(2000000),15000);assert.equal(formatTimer(3661000),'01:01:01');console.log('Dashboard render and timer pause/resume checks passed.');

const {Solver,Playground}=await import(out+'/components/study/solver.mjs');
for (const lesson of lessons) {
 const exercise=exercises(lesson)[0];
 const html=renderToString(React.createElement(AppContext.Provider,{value:{...defaultCtx,lesson,timerGuard:{current:null},updateTimer:()=>{}}},React.createElement(Solver,{exercise})));
 assert.ok(html.includes('Submit'));assert.ok(html.includes('Start from scratch'));assert.ok(!html.includes('My approach'));assert.ok(!html.includes('Mark self-reviewed'));assert.ok(html.includes('Why this result?'));assert.ok(!html.includes('class="practice-timer'));assert.ok(html.includes('Pause session')||html.includes('Resume session'));
}
const playground=renderToString(React.createElement(AppContext.Provider,{value:{...defaultCtx,lesson:lessons[0]}},React.createElement(Playground)));
assert.ok(playground.includes('Run code'));assert.ok(playground.includes('Full screen'));assert.ok(playground.includes('playground-panels'));
assert.ok(playground.includes('aria-label="Terminal position"'));assert.ok(playground.includes('dock-right'),'Desktop Playground starts with its terminal on the right');
assert.ok(playground.includes('Program input'),'Playground must expose input next to its terminal');
assert.ok(playground.includes('Clear output'),'Playground must have terminal controls');
assert.ok(!playground.includes('test-console'),'Playground must not use judged test-case cards');
const {TerminalOutput}=await import(out+'/components/study/playground-terminal.mjs');
const terminalCase={input:'10 20',output:'  1  2\n\n<value> & 3\n',stderr:'',status:'success',exitCode:0};
const terminalProps={result:{id:'terminal-run',testedCode:'source',cases:[terminalCase]},loading:false,error:'',code:'source',input:'10 20'};
const terminal=(props={})=>renderToString(React.createElement(TerminalOutput,{...terminalProps,...props}));
const outputHTML=terminal();assert.ok(outputHTML.includes('  1  2\n\n&lt;value&gt; &amp; 3\n'),'Preserve stdout whitespace and escape program text');assert.ok(outputHTML.includes('Process exited with code 0.'));assert.ok(!outputHTML.includes('Expected output'));assert.ok(!outputHTML.includes('Case 1'));assert.ok(!outputHTML.includes('10 20'),'Do not fabricate input echo in stdout');
assert.ok(terminal({input:'99'}).includes('Code or input has changed'));
assert.ok(terminal({code:'changed'}).includes('Code or input has changed'));
assert.ok(!terminal({loading:true}).includes('Process exited with code'),'Do not show an old successful result while running');
assert.ok(terminal({result:null,error:'Service unavailable'}).includes('Service unavailable'));
const withCase=extra=>terminal({result:{...terminalProps.result,cases:[{...terminalCase,...extra}]}});
assert.ok(withCase({output:'',stderr:'',status:'success'}).includes('without printing output'));
const compileError=withCase({output:'',stderr:'Main.java:4: error: missing semicolon',status:'compile-error',exitCode:undefined});assert.ok(compileError.includes('Main.java:4: error: missing semicolon'));assert.ok(compileError.includes('Compilation error'));assert.ok(!compileError.includes('Process exited with code 0'));
const runtimeError=withCase({output:'Before the error\n',stderr:'java.util.NoSuchElementException',status:'runtime-error',exitCode:1});assert.ok(runtimeError.includes('Before the error'));assert.ok(runtimeError.includes('Process exited with code 1'));assert.ok(runtimeError.includes('asked for more input'));
assert.ok(withCase({stderr:'java.util.InputMismatchException',status:'runtime-error'}).includes('wrong type'));
const longValue='0123456789'.repeat(350);assert.ok(withCase({output:longValue}).includes(longValue),'Display the complete received output, not a card preview');
assert.ok(withCase({outputTruncated:true}).includes('60,000 characters'));
console.log('Terminal output, whitespace, escaping, errors, empty output, changed input, and complete output renders passed.');
console.log('20 coding workspaces and full-page Playground server renders passed.');
const Tracker=(await import(out+'/components/study/tracker.mjs')).default;const trackerHTML=renderToString(React.createElement(AppContext.Provider,{value:{...defaultCtx,view:'tracker',lesson:lessons[0]}},React.createElement(Tracker)));assert.ok(trackerHTML.includes('Daily'));assert.ok(trackerHTML.includes('Monthly'));assert.ok(trackerHTML.includes('GitHub commits'));assert.ok(trackerHTML.includes('India time'));assert.ok(trackerHTML.includes('Start session'));console.log('Daily/monthly Tracker renders with the empty-state graph and centralized session control.');
const completedLevels=['Easy','Medium','Hard'].map(level=>exercises(lessons[0]).find(problem=>problem.difficulty===level));
const events=[...completedLevels,completedLevels[0]].map((problem,i)=>({key:'test-event-'+i,kind:'program',id:problem.id,at:new Date().toISOString()}));
const difficultyHTML=renderToString(React.createElement(AppContext.Provider,{value:{...defaultCtx,view:'tracker',lesson:lessons[0],data:{...defaultCtx.data,activity:{sessions:[],events,commits:[]}}}},React.createElement(Tracker)));
for(const level of ['Easy','Medium','Hard']){assert.ok(difficultyHTML.includes(`Show ${level.toLowerCase()} problem graph: 1 completed`));assert.ok(difficultyHTML.replace(/<!--.*?-->/g,'').includes(level+' problems'));}
console.log('Populated Tracker renders one completion at each difficulty without duplicating a same-day solve.');

compile(root+'/components/study/account-gate.tsx');
const AccountGate=(await import(out+'/components/study/account-gate.mjs')).default;
const signedOut=renderToString(React.createElement(AccountGate));
assert.ok(signedOut.includes('Your learning.'));
assert.ok(signedOut.includes('Your progress.'));
assert.ok(signedOut.includes('Checking your account'));
assert.ok(!signedOut.includes('topic-problem-row'),'No learner workspace before session verification');
console.log('Signed-out account gate server render passed.');

console.error=originalError;assert.equal(renderWarnings.length,0,'React rendering warnings must be resolved');
fs.rmSync(out,{recursive:true,force:true});
