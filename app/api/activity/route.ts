import {ApiError,body,db,failure,getRecord,identity,json,mutation} from '@/lib/server';
import {activityFor} from '@/lib/activity-server';
import {StudySession} from '@/lib/tracker';
export async function GET(req:Request){try{const user=identity(req);return json({...await activityFor(user),owner:user})}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 mutation(req);const user=identity(req),b=await body(req),now=Date.now();
 if(b.owner!==user)throw new ApiError('Please reload to continue tracking this account.',403);
 if(typeof b.id!=='string'||!/^[-a-zA-Z0-9]{20,60}$/.test(b.id))throw new ApiError('Invalid study session.');
 if(!['lesson','practice','playground'].includes(b.kind))throw new ApiError('Choose a study activity.');
 if(!Number.isSafeInteger(b.start)||!Number.isSafeInteger(b.end)||b.start<0||b.end<b.start||b.end>now+30000||b.end-b.start>86400000)throw new ApiError('Invalid session time.');
 const session:StudySession={id:b.id,kind:b.kind,start:b.start,end:b.end};
 // A session's start and activity never change. Replays only extend its confirmed end.
 await db().prepare(`INSERT INTO records(user_id,id,data,updated_at) VALUES(?,?,?,?)
 ON CONFLICT(user_id,id) DO UPDATE SET data=json_set(records.data,'$.end',MAX(json_extract(records.data,'$.end'),json_extract(excluded.data,'$.end'))),updated_at=excluded.updated_at
 WHERE json_extract(records.data,'$.start')=json_extract(excluded.data,'$.start') AND json_extract(records.data,'$.kind')=json_extract(excluded.data,'$.kind')`).bind(user,'study:'+b.id,JSON.stringify(session),new Date().toISOString()).run();
 const saved=await getRecord(user,'study:'+b.id);
 if(saved.start!==b.start||saved.kind!==b.kind)throw new ApiError('This session was already saved with different details.');
 return json({session:saved});
 }catch(e){return failure(e)}}
