'use client';
import {sessionHeaders} from '@/lib/session-client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Pause,Play} from 'lucide-react';
import {StudyClock,StudyKind,StudySession,studyDay} from '@/lib/tracker';
import {useApp} from './shared';

export type StudyControls={running:boolean;kind:StudyKind|null;snapshot:StudySession|null;pending:StudySession[];error:boolean;start:(kind:StudyKind)=>void;pause:()=>void;flush:()=>Promise<boolean>};
export function useStudyClock(ready:boolean,userId:string|undefined,onSaved:(session:StudySession)=>void):StudyControls{
 const owner=useRef(userId);
 const clock=useRef(new StudyClock()),pending=useRef(new Map<string,StudySession>()),queue=useRef<Promise<boolean>>(Promise.resolve(true)),[tick,setTick]=useState(0),[error,setError]=useState(false);
 const storageKey=userId?'java-forge:pending-study:'+userId:'';
 const refresh=useCallback(()=>setTick(t=>t+1),[]);
 const cache=useCallback(()=>{if(!storageKey)return;try{localStorage.setItem(storageKey,JSON.stringify([...pending.current.values()]))}catch{/* D1 remains authoritative when browser storage is unavailable. */}},[storageKey]);
 const remember=useCallback((session:StudySession|null)=>{if(session&&session.end>session.start){pending.current.set(session.id,session);cache()}},[cache]);
 const flush=useCallback(()=>{
  remember(clock.current.snapshot());
  if(!ready||!userId||owner.current!==userId)return Promise.resolve(false);
  const send=async()=>{let success=true;const batch=[...pending.current.values()];
   for(const session of batch){try{
    if(owner.current!==userId)return false;
    const response=await fetch('/api/activity',{method:'POST',headers:{...sessionHeaders(),'Content-Type':'application/json'},body:JSON.stringify({...session,owner:userId}),keepalive:true});
    if(!response.ok)throw new Error('Study time save failed');
    const result=await response.json() as {session:StudySession};if(owner.current!==userId)return false;onSaved(result.session);
    if((pending.current.get(session.id)?.end??Infinity)<=result.session.end)pending.current.delete(session.id);
   }catch{success=false}}
   cache();setError(!success);refresh();return success;
  };const next=queue.current.then(send,send);queue.current=next;return next;
 },[ready,userId,remember,cache,onSaved,refresh]);
 const start=useCallback((kind:StudyKind)=>{if(!ready||!userId||document.visibilityState!=='visible'||!document.hasFocus())return;remember(clock.current.start(kind));refresh()},[ready,userId,remember,refresh]);
 const pause=useCallback(()=>{remember(clock.current.pause());refresh();void flush()},[remember,refresh,flush]);
 useEffect(()=>{
  if(!ready||!storageKey)return;
  if(owner.current!==userId){clock.current.pause();pending.current.clear();owner.current=userId}
  try{const cached=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(cached))for(const s of cached){if(s&&typeof s.id==='string'&&['lesson','practice','playground'].includes(s.kind)&&Number.isSafeInteger(s.start)&&Number.isSafeInteger(s.end)&&s.end>=s.start)pending.current.set(s.id,s)}}catch{}
  void flush();
 },[ready,userId,storageKey,flush]);
 useEffect(()=>{
  let date=studyDay();
  const tickId=setInterval(()=>{const current=studyDay();if(clock.current.running||current!==date)refresh();date=current},1000);
  const saveId=setInterval(()=>{
   const current=clock.current.snapshot();
   // Bound each persisted interval without resetting the daily total.
   if(current&&current.end-current.start>=3600000){remember(clock.current.pause(current.end));clock.current.start(current.kind,current.end)}
   if(current||pending.current.size)void flush();
  },15000);
  const hidden=()=>{if(document.visibilityState==='hidden')pause()};
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',pause);window.addEventListener('blur',pause);
  return()=>{clearInterval(tickId);clearInterval(saveId);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',pause);window.removeEventListener('blur',pause)};
 },[flush,pause,refresh,remember]);
 void tick;
 return {running:clock.current.running,kind:clock.current.kind,snapshot:clock.current.snapshot(),pending:[...pending.current.values()],error,start,pause,flush};
}

/** Coding gets one pause control. Numeric time belongs only on Tracker. */
export function CodingSessionControl({disabled=false}:{disabled?:boolean}){
 const {study,view}=useApp();const kind=view==='playground'?'playground':'practice';
 return <button type="button" className={'coding-session-control '+(study.running?'running':'')} disabled={disabled} onClick={()=>study.running?study.pause():study.start(kind)} title="Clicking or typing in the editor resumes your daily study session.">{study.running?<Pause size={15}/>:<Play size={15}/>}<span>{study.running?'Pause session':'Resume session'}</span></button>;
}
