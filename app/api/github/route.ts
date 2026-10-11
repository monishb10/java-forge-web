import {body,db,encrypt,failure,getRecord,identity,json,mutation,ApiError} from '@/lib/server';
import {githubRequest as gh,githubPart as part,saveCompletedProblem} from '@/lib/github-sync';
export async function POST(req:Request){try{mutation(req);const user=identity(req);const b=await body(req);
 if(b.action==='disconnect'){await db().prepare('DELETE FROM settings WHERE user_id=?').bind(user).run();return json({connected:false});}
 if(b.action==='connect'){
 const token=String(b.token||'').trim(),repo=String(b.repo||'').trim(),email=String(b.email||'').trim();if(!token||token.length>500||!/^[-\w.]+\/[-\w.]+$/.test(repo))throw new ApiError('Enter a token and repository in owner/repository format.');if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError('Enter a valid GitHub-verified commit email.');
 const [ur,rr]=await Promise.all([gh(token,'/user'),gh(token,'/repos/'+repo.split('/').map(part).join('/'))]);if(!ur.ok)throw new ApiError('GitHub could not validate this token. Check that it is current and copied completely.');if(!rr.ok)throw new ApiError('GitHub could not access this repository. Check the name and token repository access.');const u=await ur.json() as any,r=await rr.json() as any;
 if(r.archived)throw new ApiError('Choose a repository that is not archived.');if(r.permissions?.push===false)throw new ApiError('This account does not have write access to that repository.');
 const data={repo:r.full_name,branch:r.default_branch,login:u.login,name:u.name||u.login,email:email||`${u.id}+${u.login}@users.noreply.github.com`,fork:!!r.fork,connectedAt:new Date().toISOString()};
 await db().prepare('INSERT INTO settings(user_id,data,token) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,token=excluded.token').bind(user,JSON.stringify(data),await encrypt(token)).run();return json({connected:true,...data});
 }
 if(b.action!=='save')throw new ApiError('Unknown GitHub action.');
 const result=await saveCompletedProblem(user,String(b.id||''));
 if(result.status!=='saved')throw new ApiError(result.message||'GitHub save unavailable.');
 return json({...result,record:await getRecord(user,b.id)});
 }catch(e){return failure(e)}}
