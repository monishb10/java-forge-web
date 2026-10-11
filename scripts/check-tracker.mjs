import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'java-forge-tracker-'));
const require=createRequire(root+'/package.json'),ts=require('typescript');
for(const [name,file]of Object.entries({tracker:'lib/tracker.ts',server:'lib/server.ts','activity-server':'lib/activity-server.ts',activity:'app/api/activity/route.ts',state:'app/api/state/route.ts',curriculum:'lib/curriculum.ts','github-sync':'lib/github-sync.ts'})){
 const source=fs.readFileSync(root+'/'+file,'utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__trackerEnv;').replace("import raw from './curriculum.json';",`const raw=${fs.readFileSync(root+'/lib/curriculum.json','utf8')};`).replace("import rawBank from './practice-bank.json';",`const rawBank=${fs.readFileSync(root+'/lib/practice-bank.json','utf8')};`).replace("import legacyBank from './legacy-practice-bank.json';",`const legacyBank=${fs.readFileSync(root+'/lib/legacy-practice-bank.json','utf8')};`).replace(/'@\/lib\/([^']+)'/g,"'./$1.mjs'");
 fs.writeFileSync(out+'/'+name+'.mjs',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync(root+'/drizzle/0000_right_the_leader.sql','utf8'));
function statement(q,args=[]){return{bind(...a){return statement(q,a)},async run(){sql.prepare(q).run(...args);return{success:true}},async all(){return{results:sql.prepare(q).all(...args)}},async first(){return sql.prepare(q).get(...args)||null}}}
globalThis.__trackerEnv={DB:{prepare:statement,batch:async entries=>Promise.all(entries.map(e=>e.run()))}};
const {StudyClock,studyDay,dayStart,dailyStats,monthDays,shiftMonth,mergeSessions,mergeActivity,countProgramsByDifficulty}=await import(out+'/tracker.mjs');
const activity=await import(out+'/activity.mjs'),state=await import(out+'/state.mjs'),{findExercise,lessons,exercises}=await import(out+'/curriculum.mjs');
const empty=()=>({sessions:[],events:[],commits:[]});let checks=0;
function check(name,actual,expected){assert.deepEqual(actual,expected,name);checks++}
async function call(route,data,user='learner',origin){const headers={'content-type':'application/json'};if(user)headers['oai-authenticated-user-id']=user;if(origin)headers.origin=origin;const response=await route[data?'POST':'GET'](new Request('https://test.invalid/api',{method:data?'POST':'GET',headers,body:data?JSON.stringify(data):undefined}));return{httpStatus:response.status,...await response.json()}}
try{
 check('Difficulty breakdown is available',typeof countProgramsByDifficulty,'function');
 const difficultyFor=id=>findExercise(id)?.exercise.difficulty;
 const levels=['Easy','Medium','Hard'].map(level=>exercises(lessons[0]).find(problem=>problem.difficulty===level)?.id);
 assert.ok(levels.every(Boolean),'Use one real program at each difficulty');
 check('Each solved program belongs to its actual difficulty',countProgramsByDifficulty([...levels,levels[0],'retired-program'],difficultyFor),{Easy:1,Medium:1,Hard:1,unknown:1});
 check('An empty day has zero completions in every difficulty',countProgramsByDifficulty([],difficultyFor),{Easy:0,Medium:0,Hard:0,unknown:0});
 const difficultyActivity={...empty(),events:[...levels,levels[0]].map((id,i)=>({key:'level-'+i,kind:'program',id,at:'2026-10-01T02:00:00Z'})).concat({key:'next-day',kind:'program',id:levels[2],at:'2026-10-02T02:00:00Z'})};
 const monthlyCounts=monthDays('2026-10').map(day=>countProgramsByDifficulty(dailyStats(day,difficultyActivity).programs,difficultyFor));
 check('Monthly difficulty counts add daily completions without same-day duplicates',monthlyCounts.reduce((sum,c)=>[sum[0]+c.Easy,sum[1]+c.Medium,sum[2]+c.Hard],[0,0,0]),[1,1,2]);
 const clock=new StudyClock();clock.start('practice',1000,'one');clock.start('practice',3000,'ignored');check('Repeated editor engagement does not reset session start',clock.snapshot(6000).start,1000);
 const first=clock.pause(6000);check('Pause records active duration',first.end-first.start,5000);check('Paused intervals do not keep increasing',clock.snapshot(19000),null);check('Pause is idempotent',clock.pause(19000),null);
 clock.start('practice',20000,'two');const second=clock.pause(25000);check('Editing after pause starts a separate interval',second.start,20000);check('Paused gap excluded',first.end-first.start+second.end-second.start,10000);
 clock.start('lesson',30000,'three');const lesson=clock.start('playground',35000,'four');check('Switching activity closes the previous interval',lesson.kind,'lesson');check('Activity starts at the switch point',clock.snapshot(38000).start,35000);
 const midnight=Date.parse('2026-09-30T18:30:00Z');check('IST date before midnight',studyDay(midnight-1),'2026-09-30');check('IST date after midnight',studyDay(midnight),'2026-10-01');
 const crossing={...empty(),sessions:[{id:'midnight',kind:'practice',start:midnight-30000,end:midnight+45000}]};check('Month-end session split before midnight',dailyStats('2026-09-30',crossing).time,30000);check('Month-end session split after midnight',dailyStats('2026-10-01',crossing).time,45000);
 const base=dayStart('2026-10-01'),overlap={...empty(),sessions:[{id:'a',kind:'practice',start:base,end:base+60000},{id:'b',kind:'lesson',start:base+30000,end:base+90000}]};const overlapResult=dailyStats('2026-10-01',overlap);
 check('Overlapping windows count elapsed time once',overlapResult.time,90000);check('Category totals partition the same time',overlapResult.byKind,{practice:30000,lesson:60000,playground:0});
 check('A saved checkpoint and a live session merge by ID',mergeSessions([{id:'a',kind:'practice',start:1,end:9}],[{id:'a',kind:'practice',start:1,end:12}]).length,1);
 check('Late checkpoints cannot reduce shown time',mergeSessions([{id:'a',kind:'practice',start:1,end:12}],[{id:'a',kind:'practice',start:1,end:9}])[0].end,12);
 const fresh={sessions:[{id:'new',kind:'lesson',start:1,end:15}],events:[{key:'lesson:date:x',kind:'lesson',id:'x',at:'2026-10-01T02:00:00Z'}],commits:[{url:'confirmed',repo:'a/b',at:'2026-10-01T02:00:00Z',problemId:'x'}]};const refreshed=mergeActivity(fresh,empty());check('An older empty refresh cannot erase a newly saved session',refreshed.sessions.length,1);check('An older refresh preserves new lesson and commit records',[refreshed.events.length,refreshed.commits.length],[1,1]);
 check('Leap-year calendar',monthDays('2028-02').length,29);check('Regular February calendar',monthDays('2027-02').length,28);check('Month navigation crosses years',shiftMonth('2026-01',-1),'2025-12');
 const now=Date.now(),session={owner:'learner',id:'tracker-session-00000001',kind:'practice',start:now-60000,end:now-30000};
 check('Unauthenticated time write rejected',(await call(activity,session,null)).httpStatus,401);check('Cross-origin time write rejected',(await call(activity,session,'learner','https://elsewhere.invalid')).httpStatus,403);check('Pending time cannot transfer to another account',(await call(activity,session,'other')).httpStatus,403);
 check('Time interval saved',(await call(activity,session)).session.end,session.end);check('Retry is idempotent',(await call(activity,session)).session.end,session.end);
 check('Checkpoint extends the interval',(await call(activity,{...session,end:now})).session.end,now);check('Late response cannot shorten interval',(await call(activity,session)).session.end,now);
 check('Session start cannot be changed',(await call(activity,{...session,start:now-90000})).httpStatus,400);check('Session kind cannot be changed',(await call(activity,{...session,kind:'lesson'})).httpStatus,400);
 check('Unknown kind rejected',(await call(activity,{...session,id:'tracker-session-00000002',kind:'unknown'})).httpStatus,400);check('Backwards interval rejected',(await call(activity,{...session,id:'tracker-session-00000002',end:session.start-1})).httpStatus,400);check('Future interval rejected',(await call(activity,{...session,id:'tracker-session-00000002',end:now+120000})).httpStatus,400);
 check('Other account cannot read sessions',(await call(activity,null,'other')).sessions.length,0);check('Saved sessions survive a fresh state load',(await call(state)).activity.sessions.length,1);check('Sessions stay out of coding drafts',Object.keys((await call(state)).records).filter(k=>k.startsWith('study:')).length,0);
 check('Opening state does not mark lessons studied',(await call(activity)).events.length,0);
 await call(state,{action:'topic',id:'variables',note:'A useful note'});check('Saving notes is not a lesson completion',(await call(activity)).events.length,0);
 await call(state,{action:'topic',id:'variables',read:true,mastered:true,studiedToday:true});await call(state,{action:'topic',id:'variables',read:true,studiedToday:true});
 check('Repeated lesson completion counts once per day',(await call(activity)).events.filter(e=>e.kind==='lesson').length,1);check('Unknown lesson cannot create an event',(await call(state,{action:'topic',id:'missing',studiedToday:true})).httpStatus,400);
 const id='variables-2',exercise=findExercise(id).exercise,code='verified source',runId='tracker-verified-run';
 sql.prepare('INSERT INTO runs(id,user_id,exercise_id,code,result,created_at) VALUES(?,?,?,?,?,?)').run(runId,'learner',id,code,JSON.stringify({passed:true,cases:exercise.tests.map(t=>({input:t.input,expected:t.output,strictWhitespace:!!t.strictWhitespace}))}),now);
 await call(state,{action:'draft',id,code});check('Draft is not a solved program',(await call(activity)).events.filter(e=>e.kind==='program').length,0);
 check('Unverified submission rejected',(await call(state,{action:'submit',id,code,runId:'missing'})).httpStatus,400);
 await call(state,{action:'submit',id,code,runId});await call(state,{action:'submit',id,code,runId});check('Repeated successful submit counts once per day',(await call(activity)).events.filter(e=>e.kind==='program').length,1);
 const receipt=(key,data)=>sql.prepare('INSERT INTO records(user_id,id,data,updated_at) VALUES(?,?,?,?)').run('learner',key,JSON.stringify(data),new Date(now).toISOString());
 receipt('github:learner/java/variables-2',{repo:'learner/java',url:'https://github.com/learner/java/blob/main/file',commit:'https://github.com/learner/java/commit/abc',savedAt:new Date(now).toISOString()});receipt('github:learner/java/arrays-2',{repo:'learner/java',url:'https://github.com/learner/java/blob/main/other',savedAt:new Date(now).toISOString()});
 check('Only confirmed GitHub commits are counted',(await call(activity)).commits.length,1);
 const loaded=await call(state),today=dailyStats(studyDay(),loaded.activity,loaded.records);check('First-completion fallback does not duplicate a new event',today.programs.length,1);check('Daily studied count',today.lessons.length,1);check('Daily confirmed commit count',today.commits.length,1);
 const historical={...empty(),events:[{key:'a',kind:'program',id:'p',at:'2026-10-01T02:00:00Z'},{key:'b',kind:'program',id:'p',at:'2026-10-01T03:00:00Z'},{key:'c',kind:'program',id:'p',at:'2026-10-02T02:00:00Z'}]};check('Same program counts once per day',dailyStats('2026-10-01',historical).programs.length,1);check('Solving again another day counts on that day',dailyStats('2026-10-02',historical).programs.length,1);
 console.log(JSON.stringify({passed:checks,scope:'Daily timing, pause/resume, midnight/month boundaries, overlap, retries, account isolation, verified completions and confirmed commits',externalWrites:0}));
}finally{sql.close();fs.rmSync(out,{recursive:true,force:true})}
