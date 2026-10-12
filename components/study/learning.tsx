'use client';
import React,{useEffect,useState} from 'react';
import {ArrowRight,BookOpen,CheckCircle2,Search} from 'lucide-react';
import {lessons,phases,exercises,Lesson,Exercise,programCount,foundationProgramsPerTopic,findExercise,isFoundationExercise} from '@/lib/curriculum';
import {useApp,solved,Data} from './shared';
export {LessonPage,CourseOutline} from './lesson-page';
export function Difficulty({value}:{value:string}){return <span className={'difficulty '+value.toLowerCase()}>{value}</span>}
function complete(data:Data,e:Exercise){return solved(data.records[e.id],e)}
export function ExerciseList({lesson:l,difficulty='all'}:{lesson:Lesson;difficulty?:string}){
 const {data,navigate}=useApp(),all=exercises(l),programs=all.filter(e=>difficulty==='all'||e.difficulty===difficulty);
 return <div className="topic-problems">{programs.map((e,i)=>{
  const done=complete(data,e),started=!!data.records[e.id]?.updatedAt;
  return <React.Fragment key={e.id}>{(i===0||programs[i-1].difficulty!==e.difficulty)&&<div className="problem-group-label"><span>{e.difficulty}</span><span>{programs.filter(p=>p.difficulty===e.difficulty).length} programs</span></div>}<button className="topic-problem-row" onClick={()=>navigate('practice',l.id,e.id)}><span className="question-number">{String(all.indexOf(e)+1).padStart(2,'0')}</span><div className="topic-problem-title"><b>{e.title}</b><span>{e.skills?.slice(0,2).join(' · ')}{e.skills?.length?' · ':''}{e.tests.length} test cases</span></div><Difficulty value={e.difficulty}/><span className={'problem-work-status '+(done?'done':'')}>{done?<><CheckCircle2 size={15}/>Solved</>:started?'Continue':'Start'}{!done&&<ArrowRight size={14}/>}</span></button></React.Fragment>;
 })}</div>;
}
export function ProblemLibrary(){
 const {data,lesson,navigate}=useApp();
 const [phase,setPhase]=useState('all'),[search,setSearch]=useState(''),[expanded,setExpanded]=useState(lesson.id),[difficulty,setDifficulty]=useState('all');
 const earlier=Object.entries(data.records).filter(([id,r])=>!isFoundationExercise(id)&&findExercise(id)&&(r.code||r.status==='accepted'||r.updatedAt)).map(([id,record])=>({...findExercise(id)!,record})).sort((a,b)=>(b.record.updatedAt||'').localeCompare(a.record.updatedAt||''));
 const filtered=lessons.filter(l=>(phase==='all'||l.phase===Number(phase))&&l.title.toLowerCase().includes(search.trim().toLowerCase()));
 const topic=filtered.find(l=>l.id===expanded)||filtered[0];
 const done=topic?exercises(topic).filter(e=>complete(data,e)).length:0;
 useEffect(()=>{setExpanded(lesson.id);setDifficulty('all')},[lesson.id]);
 return <div className="topic-library editorial-practice">
  <header className="editorial-page-heading"><div><p className="eyebrow"><span className="editorial-star">✳</span> THE PRACTICE LIBRARY</p><h1>THINK IT.<br/>CODE IT.</h1><p>One topic at a time. One program at a time.</p></div><div className="editorial-page-count"><strong>{programCount}</strong><span>programs across {lessons.length} topics</span><small>{foundationProgramsPerTopic} programs per topic</small></div></header>
  <div className="practice-browser">
   <aside className="practice-topic-rail" aria-label="Practice topics"><div className="practice-rail-title"><h2>Topics</h2><span>{filtered.length}</span></div><label className="problem-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a topic" aria-label="Search topics"/></label><label className="practice-phase-select"><span>Learning stage</span><select value={phase} onChange={e=>setPhase(e.target.value)} aria-label="Filter topics by learning stage"><option value="all">All stages</option>{phases.map((p,i)=><option value={i} key={p.name}>{p.name}</option>)}</select></label>
    <nav className="practice-topic-list" aria-label="Choose a practice topic">{phases.map((p,i)=>{const group=filtered.filter(l=>l.phase===i);return group.length>0&&<section key={p.name}><h3>{String(i+1).padStart(2,'0')} / {p.name}</h3>{group.map(l=>{const count=exercises(l).filter(e=>complete(data,e)).length;return <button key={l.id} className={topic?.id===l.id?'selected':''} aria-current={topic?.id===l.id?'page':undefined} onClick={()=>{setExpanded(l.id);setDifficulty('all');void navigate('practice',l.id)}}><span className="rail-topic-number">{String(lessons.indexOf(l)+1).padStart(2,'0')}</span><span>{l.title}<small>{count} / {exercises(l).length} solved</small></span>{count===exercises(l).length?<CheckCircle2 size={15}/>:<ArrowRight size={14}/>}</button>})}</section>})}</nav>
   </aside>
   <section className="practice-problem-panel" aria-label={topic?topic.title+' programs':'Practice programs'}>{topic?<>
    <div className="practice-topic-intro"><div><p className="eyebrow">TOPIC {String(lessons.indexOf(topic)+1).padStart(2,'0')} / {String(lessons.length).padStart(2,'0')}</p><h2>{topic.title}</h2><p>Start with Easy programs. Write your solution, run the tests, and submit.</p></div><button className="secondary" onClick={()=>navigate('learn',topic.id)}><BookOpen size={15}/>Watch lesson<ArrowRight size={14}/></button></div>
    <div className="practice-topic-progress"><progress value={done} max={exercises(topic).length} aria-label={topic.title+' completion'}/><span>{done} / {exercises(topic).length} solved</span></div>
    <div className="practice-table-toolbar"><div className="difficulty-filters" role="group" aria-label="Filter problems by difficulty">{['all','Easy','Medium','Hard'].map(level=><button key={level} aria-pressed={difficulty===level} onClick={()=>setDifficulty(level)}>{level==='all'?'All programs':level}</button>)}</div><span>{exercises(topic).filter(e=>difficulty==='all'||e.difficulty===difficulty).length} programs</span></div>
    <div className="practice-table-heading" aria-hidden="true"><span>#</span><span>Program</span><span>Level</span><span>Status</span></div><ExerciseList lesson={topic} difficulty={difficulty}/><div className="topic-set-footer"><span>Write code → Run tests → Submit</span><span>Every program starts with a blank editor.</span></div>
   </>:<div className="empty-state"><Search size={28}/><h3>No matching topics</h3><p>Try another topic name or choose all stages.</p><button className="secondary" onClick={()=>{setSearch('');setPhase('all')}}>Show all topics</button></div>}</section>
  </div>
  {earlier.length>0&&<details className="earlier-practice"><summary>Earlier saved practice · {earlier.length} programs</summary><p>Your earlier drafts, completed programs, and GitHub saves.</p><div className="earlier-practice-list">{earlier.map(({lesson:l,exercise:e,record})=><button key={e.id} onClick={()=>navigate('practice',l.id,e.id)}><span><b>{e.title}</b><br/><small>{l.title}</small></span><span>{solved(record,e)?'Completed':'Continue draft'}</span></button>)}</div></details>}
 </div>;
}
