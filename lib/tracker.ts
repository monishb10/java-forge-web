export type StudyKind='lesson'|'practice'|'playground';
export type StudySession={id:string;kind:StudyKind;start:number;end:number};
export type StudyEvent={key:string;kind:'lesson'|'program';id:string;at:string};
export type StudyCommit={url:string;repo:string;at:string;problemId:string};
export type ActivityData={sessions:StudySession[];events:StudyEvent[];commits:StudyCommit[]};
export const EMPTY_ACTIVITY:ActivityData={sessions:[],events:[],commits:[]};
export const STUDY_ZONE='Asia/Kolkata';
export const DAY_MS=86400000,IST_OFFSET=19800000;
export const kindLabels:Record<StudyKind,string>={lesson:'Lessons',practice:'Practice',playground:'Playground'};
export const problemDifficulties=['Easy','Medium','Hard'] as const;
export type ProblemDifficulty=typeof problemDifficulties[number];
export type DifficultyCounts=Record<ProblemDifficulty|'unknown',number>;
export function countProgramsByDifficulty(ids:string[],difficultyFor:(id:string)=>ProblemDifficulty|undefined):DifficultyCounts{
 const counts:DifficultyCounts={Easy:0,Medium:0,Hard:0,unknown:0};
 for(const id of new Set(ids)){const difficulty=difficultyFor(id);counts[difficulty&&problemDifficulties.includes(difficulty)?difficulty:'unknown']++}
 return counts;
}
export function studyDay(time:number|string=Date.now()){const ms=typeof time==='string'?Date.parse(time):time;return Number.isFinite(ms)?new Date(ms+IST_OFFSET).toISOString().slice(0,10):''}
export function dayStart(day:string){return Date.parse(day+'T00:00:00+05:30')}
export function monthDays(month:string){const count=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate();return Array.from({length:count},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`)}
export function shiftMonth(month:string,delta:number){return new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7))-1+delta,1)).toISOString().slice(0,7)}
export function timeLabel(ms:number,seconds=false){const total=Math.floor(Math.max(0,ms)/1000),h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;return seconds?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:h?`${h}h ${m}m`:total<60?`${total}s`:`${m}m`}

/** One visible study session. Pause closes it; resume always starts a new interval. */
export class StudyClock{
 private active:StudySession|null=null;
 get running(){return this.active!==null}
 get kind(){return this.active?.kind??null}
 snapshot(now=Date.now()){return this.active?{...this.active,end:Math.max(this.active.start,now)}:null}
 start(kind:StudyKind,now=Date.now(),id=crypto.randomUUID()):StudySession|null{
  if(this.active?.kind===kind)return null;
  const previous=this.pause(now);this.active={id,kind,start:now,end:now};return previous;
 }
 pause(now=Date.now()){const ended=this.snapshot(now);this.active=null;return ended}
}

export type DayStats={day:string;time:number;byKind:Record<StudyKind,number>;programs:string[];lessons:string[];commits:StudyCommit[]};
/** Merge overlapping sessions, including multiple windows. Never count one second twice. */
export function dailyStats(day:string,activity:ActivityData,legacyRecords:Record<string,{completedAt?:string;testCount?:number}>={}):DayStats{
 const start=dayStart(day),end=start+DAY_MS,byKind={lesson:0,practice:0,playground:0};
 const sessions=activity.sessions.filter(s=>s.end>start&&s.start<end&&s.end>s.start);
 const points=[...new Set(sessions.flatMap(s=>[Math.max(start,s.start),Math.min(end,s.end)]))].sort((a,b)=>a-b);
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1];
  const owner=sessions.filter(s=>s.start<=a&&s.end>=b).sort((x,y)=>y.start-x.start||x.id.localeCompare(y.id))[0];
  if(owner)byKind[owner.kind]+=b-a;
 }
 const events=activity.events.filter(e=>studyDay(e.at)===day),programs=new Set(events.filter(e=>e.kind==='program').map(e=>e.id)),lessons=new Set(events.filter(e=>e.kind==='lesson').map(e=>e.id));
 // Only timestamped, test-verified old completions can be placed on a calendar.
 for(const [id,record]of Object.entries(legacyRecords))if(record.completedAt&&record.testCount&&studyDay(record.completedAt)===day)programs.add(id);
 const commits=[...new Map(activity.commits.filter(c=>studyDay(c.at)===day).map(c=>[c.url,c])).values()];
 return {day,time:byKind.lesson+byKind.practice+byKind.playground,byKind,programs:[...programs],lessons:[...lessons],commits};
}
export function mergeSessions(saved:StudySession[],pending:StudySession[]){const result=new Map(saved.map(s=>[s.id,s]));for(const s of pending){const prior=result.get(s.id);if(!prior||s.end>prior.end)result.set(s.id,s)}return [...result.values()]}
/** Tracker records are append-only; an older refresh must not erase a newer save. */
export function mergeActivity(current:ActivityData,incoming:ActivityData):ActivityData{return {sessions:mergeSessions(current.sessions,incoming.sessions),events:[...new Map([...incoming.events,...current.events].map(e=>[e.key,e])).values()],commits:[...new Map([...incoming.commits,...current.commits].map(c=>[c.url,c])).values()]}}
