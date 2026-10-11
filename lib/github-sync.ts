import {Buffer} from 'node:buffer';
import {findExercise} from '@/lib/curriculum';
import {ApiError,db,decrypt,getRecord,settingsFor} from '@/lib/server';

export type GithubSaveResult={status:'saved'|'error'|'not-connected';url?:string;commit?:string;unchanged?:boolean;message?:string};
export const githubPart=(value:string)=>encodeURIComponent(value);
export function githubRequest(token:string,path:string,init?:RequestInit){
 return fetch('https://api.github.com'+path,{...init,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Java-Forge','Content-Type':'application/json'},signal:AbortSignal.timeout(15000)});
}

async function patchGithub(user:string,id:string,patch:Record<string,unknown>){
 // Update only GitHub metadata: another tab may have saved a newer code draft.
 await db().prepare('UPDATE records SET data=json_patch(data,?) WHERE user_id=? AND id=?').bind(JSON.stringify(patch),user,id).run();
}

/** One completion file per problem and repository. Never update a file on retry. */
export async function saveCompletedProblem(user:string,id:string):Promise<GithubSaveResult>{
 let ledgerId='',repoName='';
 const reflect=async(saved:any,unchanged:boolean):Promise<GithubSaveResult>=>{
  await patchGithub(user,id,{githubStatus:'saved',githubRepo:saved.repo,githubUrl:saved.url,githubCommitUrl:saved.commit||null,githubSavedAt:saved.savedAt,githubError:null});
  return {status:'saved',url:saved.url,commit:saved.commit,unchanged};
 };
 try{
  const found=findExercise(id),record=await getRecord(user,id);
  if(!found)throw new ApiError('Choose a practice problem.');
  const {exercise:e,lesson}=found;
  const complete=record.status==='accepted'&&record.suiteVersion===e.suiteVersion&&record.testCount===e.tests.length;
  if(!complete)throw new ApiError('Complete this problem before saving it to GitHub.');
  if(!record.code?.trim())throw new ApiError('Add your own Java solution first.');
  const settings=await settingsFor(user);
  if(!settings.encryptedToken)return {status:'not-connected',message:'Connect your repository in Settings to save completed problems automatically.'};
  repoName=settings.repo;
  ledgerId='github:'+repoName.toLowerCase()+'/'+id;
  const earlier=await getRecord(user,ledgerId);
  if(earlier.url)return await reflect(earlier,true);
  const token=await decrypt(settings.encryptedToken),base='/repos/'+repoName.split('/').map(githubPart).join('/');
  const repository=await githubRequest(token,base);
  if(!repository.ok)throw new ApiError('GitHub could not access your repository. Check the token and repository in Settings, then retry.');
  const repo=await repository.json() as any,branch=repo.default_branch;
  if(!branch||repo.archived||repo.permissions?.push===false)throw new ApiError('GitHub needs a writable, unarchived repository. Check Settings, then retry.');
  const path='java-forge/'+lesson.id+'/'+id+'/Main.java';
  const marker=`// Java Forge | ${lesson.title}\n// Exercise: ${e.title}\n`;
  const content=marker+'// Passed all supplied test cases.\n'+record.code;
  const url=base+'/contents/'+path.split('/').map(githubPart).join('/'),readUrl=url+'?ref='+githubPart(branch);
  const remember=async(link:string,commit?:string,unchanged=false)=>{
   const saved={repo:repoName,url:link,commit,savedAt:new Date().toISOString()};
   // This receipt survives later draft edits, reconnection, and deleted repository files.
   await db().prepare('INSERT INTO records(user_id,id,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,id) DO NOTHING').bind(user,ledgerId,JSON.stringify(saved),saved.savedAt).run();
   return reflect(await getRecord(user,ledgerId),unchanged);
  };
  const existing=async(response:Response)=>{
   const file=await response.json() as any;
   const text=typeof file.content==='string'?Buffer.from(file.content.replace(/\s/g,''),'base64').toString('utf8'):'';
   if((file.type&&file.type!=='file')||!text.startsWith(marker)||!file.html_url)throw new ApiError('A different file already uses this problem’s GitHub path. It was left unchanged.');
   return remember(file.html_url,undefined,true);
  };
  const previous=await githubRequest(token,readUrl);
  if(previous.ok)return await existing(previous);
  if(previous.status!==404)throw new ApiError('GitHub could not check the saved problem. Try again shortly.');
  let saved:Response|undefined;
  try{
   // No SHA means create-only. Concurrent or retried requests cannot update this file.
   saved=await githubRequest(token,url,{method:'PUT',body:JSON.stringify({message:`Complete ${lesson.title}: ${e.title}`,content:Buffer.from(content,'utf8').toString('base64'),branch,author:{name:settings.name,email:settings.email},committer:{name:settings.name,email:settings.email}})});
  }catch{/* A lost response can still mean GitHub committed the file. Check below. */}
  if(saved?.ok){
   const result=await saved.json() as any;
   if(result.content?.html_url)return await remember(result.content.html_url,result.commit?.html_url);
  }
  // Recover a concurrent create or lost write response without making a second commit.
  const recovered=await githubRequest(token,readUrl);
  if(recovered.ok)return await existing(recovered);
  throw new ApiError('Your problem is complete, but its GitHub save is not confirmed. Check token expiry, Contents: read and write access, and branch rules, then retry.');
 }catch(error){
  if(ledgerId){
   try{const saved=await getRecord(user,ledgerId);if(saved.url)return await reflect(saved,true)}catch{}
  }
  const message=error instanceof ApiError?error.message:'Your problem is complete. GitHub is unavailable right now; retry the save shortly.';
  if(repoName){try{await patchGithub(user,id,{githubStatus:'error',githubRepo:repoName,githubError:message})}catch{}}
  return {status:'error',message};
 }
}
