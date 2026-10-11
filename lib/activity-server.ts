import {db} from '@/lib/server';
import {studyDay,ActivityData,StudyEvent,StudySession} from '@/lib/tracker';
export function eventFor(kind:'lesson'|'program',id:string,at=new Date().toISOString()):StudyEvent{return {key:`${kind}:${studyDay(at)}:${id}`,kind,id,at}}
export function eventStatement(user:string,event:StudyEvent){return db().prepare('INSERT INTO records(user_id,id,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,id) DO NOTHING').bind(user,'activity:'+event.key,JSON.stringify(event),event.at)}
export function activityFromRows(rows:{id:string;data:string}[]):ActivityData{
 const sessions:StudySession[]=[],events:StudyEvent[]=[],commits:ActivityData['commits']=[];
 for(const row of rows){const value=JSON.parse(row.data);
  if(row.id.startsWith('study:'))sessions.push(value);
  else if(row.id.startsWith('activity:'))events.push(value);
  else if(row.id.startsWith('github:')&&value.commit&&value.savedAt)commits.push({url:value.commit,repo:value.repo,at:value.savedAt,problemId:row.id.slice(row.id.lastIndexOf('/')+1)});
 }
 return {sessions,events,commits};
}
export async function activityFor(user:string){const rows=await db().prepare("SELECT id,data FROM records WHERE user_id=? AND (id LIKE 'study:%' OR id LIKE 'activity:%' OR id LIKE 'github:%')").bind(user).all<{id:string;data:string}>();return activityFromRows(rows.results)}
