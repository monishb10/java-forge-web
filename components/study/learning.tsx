'use client';
import React,{useEffect,useState} from 'react';
import {BookOpen,CheckCircle2,Search,Layers} from 'lucide-react';
import {Accordion,AccordionContent,AccordionItem,AccordionTrigger} from '@/components/ui/accordion';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {lessons,phases,exercises,Lesson,Exercise,programCount,foundationProgramsPerTopic,findExercise,isFoundationExercise} from '@/lib/curriculum';
import {foundationGuides} from '@/lib/foundation-guides';
import {useApp,solved,Data} from './shared';
export {LessonPage,CourseOutline} from './lesson-page';
export function Difficulty({value}:{value:string}){return <span className={'difficulty '+value.toLowerCase()}>{value}</span>}
function complete(data:Data,e:Exercise){return solved(data.records[e.id],e)}
export function ExerciseList({lesson:l}:{lesson:Lesson}){
 const{data,navigate}=useApp(),programs=exercises(l);return <div className="topic-problems">{programs.map((e,i)=>{
  const done=complete(data,e),started=!!data.records[e.id]?.updatedAt;
  return <React.Fragment key={e.id}>{(i===0||programs[i-1].difficulty!==e.difficulty)&&<div className="problem-group-label"><span>{e.difficulty} · {programs.filter(p=>p.difficulty===e.difficulty).length} programs</span></div>}<button className="topic-problem-row" onClick={()=>navigate('practice',l.id,e.id)}><span className="question-number">{String(i+1).padStart(2,'0')}</span><div className="topic-problem-title"><b>{e.title}</b><span>{e.skills?.slice(0,3).join(" · ")}{e.skills?.length?" · ":""}{e.tests.length} tests</span></div><Difficulty value={e.difficulty}/><span className={'problem-work-status '+(done?'done':'')}>{done?<><CheckCircle2 size={16}/>Solved</>:started?'Continue':'Start'}</span></button></React.Fragment>
 })}</div>;
}
export function ProblemLibrary(){
 const{data,lesson,navigate}=useApp();const[phase,setPhase]=useState('all'),[search,setSearch]=useState(''),[expanded,setExpanded]=useState(lesson.id);
 const earlier=Object.entries(data.records).filter(([id,r])=>!isFoundationExercise(id)&&findExercise(id)&&(r.code||r.status==='accepted'||r.updatedAt)).map(([id,record])=>({...findExercise(id)!,record})).sort((a,b)=>(b.record.updatedAt||'').localeCompare(a.record.updatedAt||''));
 const filtered=lessons.filter(l=>(phase==='all'||l.phase===Number(phase))&&l.title.toLowerCase().includes(search.toLowerCase()));
 const openTopic=filtered.some(l=>l.id===expanded)?expanded:'';
 useEffect(()=>{setExpanded(lesson.id);if(lessons.indexOf(lesson)>0){const t=requestAnimationFrame(()=>document.getElementById('practice-topic-'+lesson.id)?.scrollIntoView({block:'start'}));return()=>cancelAnimationFrame(t)}},[lesson.id]);
 return <div className="topic-library"><div className="page-heading"><div><p className="eyebrow">CHOOSE YOUR TOPIC FIRST</p><h1>Practice</h1><p className="lead">Learn the topic first, then write your own programs from a blank editor.</p></div><span className="course-total"><Layers size={17}/>{lessons.length} topics · {programCount} programs</span></div>
  <div className="topic-library-help"><BookOpen size={21}/><p><b>Learning a topic for the first time?</b> Start with Easy programs. You can move to the next lesson once the basics make sense, then return for more practice. Hard means harder within this foundation topic.</p></div>
  <Tabs value={phase} onValueChange={setPhase} className="practice-stage-tabs"><TabsList aria-label="Filter topics by learning stage"><TabsTrigger value="all"><Layers size={17}/><span>All stages</span></TabsTrigger>{phases.map((p,i)=><TabsTrigger key={p.name} value={String(i)}><span className="practice-stage-index">{String(i+1).padStart(2,'0')}</span><span>{p.name}</span></TabsTrigger>)}</TabsList></Tabs>
  <div className="library-controls"><label className="problem-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a topic, e.g. loops or arrays…" aria-label="Search topics"/></label><span className="library-count">{filtered.length} topics · {foundationProgramsPerTopic} programs each</span></div>
  <Accordion type="single" collapsible value={openTopic} onValueChange={id=>{setExpanded(id);if(id&&id!==lesson.id)navigate('practice',id)}} className="topic-accordion">{phases.map((p,i)=>{const group=filtered.filter(l=>l.phase===i);if(!group.length)return null;return <section className="practice-phase" key={p.name}><div className="practice-phase-heading"><span>PHASE {i+1}</span><h2>{p.name}</h2></div>{group.map(l=>{const count=exercises(l).filter(e=>complete(data,e)).length;return <AccordionItem value={l.id} key={l.id} id={'practice-topic-'+l.id} className="practice-topic"><AccordionTrigger className="practice-topic-trigger"><span className="topic-tile-number">{String(lessons.indexOf(l)+1).padStart(2,'0')}</span><span className="practice-topic-title"><b>{l.title}</b><small>{count} of {exercises(l).length} completed</small></span><span className="twenty-label">{exercises(l).length} programs</span></AccordionTrigger><AccordionContent><div className="topic-context"><p>{foundationGuides[l.id]?.practiceNote}</p><button className="secondary" onClick={()=>navigate('learn',l.id)}><BookOpen size={16}/>Read this lesson</button></div><ExerciseList lesson={l}/><div className="topic-set-footer"><span>{count} / {exercises(l).length} completed</span><span>Write code · Run tests · Submit</span></div></AccordionContent></AccordionItem>})}</section>})}</Accordion>
  {!filtered.length&&<div className="empty-state"><Search size={28}/><h3>No matching topics</h3><p>Try “arrays”, “strings”, or choose all learning phases.</p><button className="secondary" onClick={()=>{setSearch('');setPhase('all')}}>Show all topics</button></div>}
  {earlier.length>0&&<details className="earlier-practice"><summary>Earlier saved practice · {earlier.length} programs</summary><p>Your previous drafts, completed programs, and GitHub saves are still here. They stay separate from the new foundation course.</p><div className="earlier-practice-list">{earlier.map(({lesson:l,exercise:e,record})=><button key={e.id} onClick={()=>navigate('practice',l.id,e.id)}><span><b>{e.title}</b><br/><small>{l.title}</small></span><span>{solved(record,e)?'Completed':'Continue draft'}</span></button>)}</div></details>}
 </div>;
}
