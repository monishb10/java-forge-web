'use client';
import {sessionHeaders} from '@/lib/session-client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Pause,Play,Timer,CheckCircle2} from 'lucide-react';
import {PracticeClock,formatTimer} from '@/lib/practice-clock';
import {useApp,PracticeTime} from './shared';

export function PracticeTimer({id,done,previouslyComplete,completing=false}:{id:string;done:boolean;previouslyComplete:boolean;completing?:boolean}){
 const {data,ready,updateTimer,timerGuard}=useApp();
 const clock=useRef(new PracticeClock()),hydrated=useRef(false),completion=useRef<number|undefined>(undefined),saved=useRef(-1),savedCompletion=useRef(false),queue=useRef<Promise<boolean>>(Promise.resolve(true));
 const [elapsed,setElapsed]=useState(0),[running,setRunning]=useState(false),[error,setError]=useState(false),[completedMs,setCompletedMs]=useState<number|undefined>();
 const refresh=useCallback(()=>{setElapsed(clock.current.total());setRunning(clock.current.running)},[]);
 const persist=useCallback((complete=false)=>{
  const ms=clock.current.total();
  if(!hydrated.current||ms<=saved.current&&(!complete||savedCompletion.current))return Promise.resolve(true);
  const send=async()=>{
   try{
    const response=await fetch('/api/time',{method:'POST',headers:{...sessionHeaders(),'Content-Type':'application/json'},body:JSON.stringify({id,elapsedMs:ms,completed:complete}),keepalive:true});
    if(!response.ok)throw new Error('Timer save failed');
    const {timer}:{timer:PracticeTime}=await response.json();
    saved.current=Math.max(saved.current,ms);savedCompletion.current=!!timer.completedMs||complete;
    if(timer.completedMs!=null){completion.current=timer.completedMs;setCompletedMs(timer.completedMs)}
    updateTimer(id,timer);setError(false);return true;
   }catch{setError(true);return false}
  };
  const next=queue.current.then(send,send);queue.current=next;return next;
 },[id,updateTimer]);
 const pause=useCallback(async()=>{clock.current.pause();refresh();return persist(completion.current!=null)},[persist,refresh]);
 // Saving a finished problem to GitHub must not add to its practice time.
 useEffect(()=>{if(completing)void pause()},[completing,pause]);
 useEffect(()=>{
  if(!ready||hydrated.current)return;
  const time=data.timers?.[id];
  clock.current=new PracticeClock(time?.elapsedMs||0);saved.current=time?.elapsedMs??-1;
  completion.current=time?.completedMs??undefined;setCompletedMs(completion.current);savedCompletion.current=completion.current!=null;
  hydrated.current=true;
  if(!previouslyComplete&&!done&&document.visibilityState==='visible')clock.current.resume();
  refresh();
 },[ready,data.timers,id,previouslyComplete,done,refresh]);
 useEffect(()=>{
  if(!ready||!hydrated.current||!done)return;
  clock.current.pause();refresh();
  if(clock.current.total()>0&&completion.current==null){completion.current=clock.current.total();setCompletedMs(completion.current);void persist(true)}
 },[done,ready,persist,refresh]);
 useEffect(()=>{
  const tick=setInterval(refresh,500);
  const autosave=setInterval(()=>{if(clock.current.running)void persist()},15000);
  const onHidden=()=>{if(document.visibilityState==='hidden')void pause()};
  const onExit=()=>{clock.current.pause();void persist(completion.current!=null)};
  document.addEventListener('visibilitychange',onHidden);window.addEventListener('pagehide',onExit);
  timerGuard.current=pause;
  return()=>{clearInterval(tick);clearInterval(autosave);document.removeEventListener('visibilitychange',onHidden);window.removeEventListener('pagehide',onExit);timerGuard.current=null;onExit()};
 },[pause,persist,refresh,timerGuard]);
 const resume=()=>{clock.current.resume();refresh()};
 return <div className={'practice-timer '+(running?'is-running':'is-paused')}>
  <div className="timer-display"><Timer size={18}/><div><span>{done?'Time spent':running?'Practice time':'Timer paused'}</span><time aria-label={'Practice time '+formatTimer(elapsed)}>{formatTimer(elapsed)}</time></div></div>
  {!done&&<button className="timer-toggle" disabled={!ready||completing} onClick={()=>running?void pause():resume()} aria-label={running?'Pause practice timer':'Resume practice timer'}>{running?<Pause size={15}/>:<Play size={15}/>}<span>{completing?'Saving…':running?'Pause':'Resume'}</span></button>}
  {done&&<span className="timer-finished"><CheckCircle2 size={16}/>{completedMs!=null?`First completed in ${formatTimer(completedMs)}`:'Completed'}</span>}
  <p>Pauses when you leave this problem or tab.</p>
  {error&&<button className="timer-error" onClick={()=>void persist(completion.current!=null)}>Time not saved · Retry</button>}
 </div>;
}
