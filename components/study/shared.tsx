'use client';
import {sessionHeaders} from '@/lib/session-client';
import React,{createContext,useContext,useEffect,useRef,useState,useCallback} from 'react';
import {toast} from 'sonner';
import {Lesson,Exercise,editorDraft} from '@/lib/curriculum';
import type {ActivityData,StudyEvent} from '@/lib/tracker';
import type {StudyControls} from './study-clock';
export type View='dashboard'|'learn'|'practice'|'playground'|'tracker'|'settings';
export type RecordData={code?:string;answer?:string;status?:string;hintUsed?:boolean;completedAt?:string;updatedAt?:string;githubUrl?:string;githubRepo?:string;githubStatus?:'saved'|'error';githubCommitUrl?:string;githubSavedAt?:string;githubError?:string;suiteVersion?:string;testCount?:number};
export type TopicData={read?:boolean;mastered?:boolean;note?:string;revise?:boolean;studiedToday?:boolean};
export type PracticeTime={elapsedMs:number;completedMs?:number;updatedAt?:string};
export type Data={userId?:string;activity:ActivityData;records:Record<string,RecordData>;topics:Record<string,TopicData>;timers:Record<string,PracticeTime>;github:any};
export type AppState={lessonStages:React.RefObject<Record<string,string>>;study:StudyControls;refreshActivity:()=>Promise<void>;data:Data;lesson:Lesson;ready:boolean;view:View;navigate:(v:View,t?:string,e?:string|null)=>Promise<boolean>;saveTopic:(id:string,patch:Partial<TopicData>)=>Promise<boolean>;updateRecord:(id:string,r:RecordData,event?:StudyEvent)=>void;updateTimer:(id:string,timer:PracticeTime)=>void;timerGuard:React.RefObject<null|(()=>Promise<boolean>)>;guard:React.RefObject<null|(()=>Promise<boolean>)>;runLock:React.RefObject<boolean>;exampleDraft:React.RefObject<string|null>};
export const AppContext=createContext<AppState>(null!);
export const useApp=()=>useContext(AppContext);
export async function api(path:string,data?:unknown){const r=await fetch(path,{method:data?'POST':'GET',headers:{...sessionHeaders(),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});let j:any;try{j=await r.json()}catch{throw new Error('The site could not complete this request. Please try again.')}if(!r.ok)throw new Error(j.error||'Please try again.');return j;}
export function solved(record:RecordData|undefined,e:Exercise){return record?.status==='accepted'&&record.suiteVersion===(e.suiteVersion||'recall-v1');}
export function useDraft(id:string,initialCode:string,preferInitial=false){
 const {data,ready,updateRecord,guard,refreshActivity}=useApp(),record=data.records[id]||{};
 const [code,setCodeState]=useState(initialCode),[answer,setAnswerState]=useState(''),[hint,setHintState]=useState(false),[saving,setSaving]=useState(false),[completing,setCompleting]=useState(false),[dirty,setDirty]=useState(false),[savedLabel,setSavedLabel]=useState('');
 const revision=useRef(0),hydrated=useRef(false),queue=useRef<Promise<unknown>>(Promise.resolve()),values=useRef({code,answer,hint});values.current={code,answer,hint};
 useEffect(()=>{if(ready&&!hydrated.current){if(!revision.current){if(preferInitial){setDirty(true);revision.current++}else{setCodeState(editorDraft(record.code,initialCode));setAnswerState(record.answer||'');setHintState(!!record.hintUsed)}}hydrated.current=true}},[ready,record,initialCode,preferInitial]);
 const setCode=(x:string)=>{setCodeState(x);revision.current++;setDirty(true)},setAnswer=(x:string)=>{setAnswerState(x);revision.current++;setDirty(true)},reveal=()=>{setHintState(true);revision.current++;setDirty(true)};
 const save=useCallback((action='draft',runId?:string):Promise<RecordData|null>=>{const snapshot={...values.current},rev=revision.current;const completion=action==='submit';if(completion)setCompleting(true);const send=async()=>{setSaving(true);if(completion)setSavedLabel('Saving completion and GitHub…');try{const r=await api('/api/state',{action,id,...snapshot,hintUsed:snapshot.hint,runId});updateRecord(id,r.record,r.event);if(completion)void refreshActivity();if(revision.current===rev){setDirty(false);setSavedLabel('All changes saved')}if(r.github?.status==='saved')toast.success(r.github.unchanged?'This problem is already saved on GitHub.':'Completed problem saved to GitHub.');if(r.github?.status==='error')toast.warning('Problem completed. GitHub save needs a retry.',{description:r.github.message});return r.record}catch(e){setSavedLabel('Not saved — retry');toast.error((e as Error).message);return null}finally{setSaving(false);if(completion)setCompleting(false)}};const next=queue.current.then(send,send);queue.current=next;return next},[id,updateRecord,refreshActivity]);
 useEffect(()=>{if(!dirty||!ready)return;setSavedLabel('Saving changes…');const t=setTimeout(()=>save(),1400);return()=>clearTimeout(t)},[code,answer,hint,dirty,ready,save]);
 useEffect(()=>{guard.current=async()=>{if(completing&&!await queue.current)return false;return !dirty||!!await save()};return()=>{guard.current=null}},[dirty,completing,save,guard]);
 useEffect(()=>{const before=(e:BeforeUnloadEvent)=>{if(dirty||completing){e.preventDefault();e.returnValue=''}};addEventListener('beforeunload',before);return()=>removeEventListener('beforeunload',before)},[dirty,completing]);
 return {code,setCode,answer,setAnswer,hint,reveal,save,saving,completing,dirty,savedLabel,record};
}
