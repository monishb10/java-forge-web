import {ApiError,body,db,failure,getRecord,identity,json,mutation} from '@/lib/server';
import {findExercise} from '@/lib/curriculum';

export async function POST(req:Request){
 try{
  mutation(req);
  const user=identity(req),b=await body(req),found=findExercise(b.id);
  if(!found)throw new ApiError('Unknown practice problem.');
  if(!Number.isSafeInteger(b.elapsedMs)||b.elapsedMs<0||b.elapsedMs>31536000000)throw new ApiError('Invalid practice time.');
  const timer:{elapsedMs:number;completedMs?:number;updatedAt:string}={elapsedMs:b.elapsedMs,updatedAt:new Date().toISOString()};
  if(b.completed){
   const record=await getRecord(user,b.id),e=found.exercise;
   const complete=record.status==='accepted'&&record.suiteVersion===e.suiteVersion;
   if(!complete)throw new ApiError('Complete this problem before recording its completion time.');
   timer.completedMs=b.elapsedMs;
  }
  // Timers use separate records so saving a code draft cannot overwrite elapsed time.
  // MAX makes delayed/retried writes safe; the first completion time stays fixed.
  await db().prepare(`INSERT INTO records(user_id,id,data,updated_at) VALUES(?,?,?,?)
   ON CONFLICT(user_id,id) DO UPDATE SET data=json_object(
    'elapsedMs',MAX(COALESCE(json_extract(records.data,'$.elapsedMs'),0),json_extract(excluded.data,'$.elapsedMs')),
    'completedMs',COALESCE(json_extract(records.data,'$.completedMs'),json_extract(excluded.data,'$.completedMs')),
    'updatedAt',excluded.updated_at),updated_at=excluded.updated_at`).bind(user,'timer:'+b.id,JSON.stringify(timer),timer.updatedAt).run();
  return json({timer:await getRecord(user,'timer:'+b.id)});
 }catch(e){return failure(e)}
}
