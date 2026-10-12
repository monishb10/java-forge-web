'use client';
import React from 'react';
import {BookOpen,CheckCircle2,Code2,NotebookPen,GitBranch,Terminal,ArrowRight,Play,ChartNoAxesCombined} from 'lucide-react';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {lessons,learningStages,exercises,findExercise,programCount,isFoundationExercise} from '@/lib/curriculum';
import {learningTopics} from '@/lib/lesson-roadmap';
import {useApp,solved} from './shared';

export default function DashboardPage(){
 const {data,navigate,ready}=useApp();
 const mastered=learningTopics.filter(l=>data.topics[l.id]?.mastered).length;
 const all=lessons.flatMap(exercises);
 const accepted=all.filter(e=>e.tests&&solved(data.records[e.id],e)).length;
 const practised=lessons.filter(l=>exercises(l).some(e=>solved(data.records[e.id],e))).length;
 const notes=learningTopics.filter(l=>data.topics[l.id]?.note);
 const recent=Object.entries(data.records).filter(([id,r])=>!!findExercise(id)&&r.updatedAt).sort((a,b)=>(b[1].updatedAt||'').localeCompare(a[1].updatedAt||'')).slice(0,6);
 const current=learningTopics.find(l=>!data.topics[l.id]?.mastered)||learningTopics[0];
 const unfinished=recent.find(([id,r])=>{const e=findExercise(id)!.exercise;return isFoundationExercise(id)&&!solved(r,e)});
 const resume=unfinished?findExercise(unfinished[0]):null;
 const metrics=[
  {Icon:BookOpen,value:`${mastered} / ${learningTopics.length}`,label:'Lessons completed',note:'Marked complete in Lessons'},
  {Icon:Code2,value:String(accepted),label:'Programs accepted',note:'Passed their supplied tests'},
  {Icon:CheckCircle2,value:`${practised} / ${lessons.length}`,label:'Topics practised',note:'At least one accepted program'},
  {Icon:GitBranch,value:String(data.activity.commits.length),label:'GitHub saves',note:'Confirmed completion commits'}
 ];
 return <div className="dashboard-page">
  <header className="studio-dashboard-hero">
   <div><span className="studio-kicker">Java foundations</span><h1 id="dashboard-title">Learn the concept.<br/><span>Write the code.</span></h1><p>A clear path from your first Java program to DSA. Watch a lesson, try a program, and make progress at your pace.</p><div className="studio-hero-actions"><button className="primary" disabled={!ready} onClick={()=>navigate('learn',current.id)}><Play size={15}/>{mastered?'Continue learning':'Start learning'}<ArrowRight size={15}/></button><button className="secondary" onClick={()=>navigate('practice',resume?.lesson.id||lessons[0].id,resume?.exercise.id||null)}><Code2 size={15}/>{resume?'Resume coding':'Explore practice'}</button></div></div>
   <section className="studio-journey-card" aria-label="Your next lesson"><div className="studio-journey-top"><span>{mastered===learningTopics.length?'COURSE COMPLETE':'YOUR NEXT STEP'}</span><b>{String(learningTopics.indexOf(current)+1).padStart(2,'0')} / {learningTopics.length}</b></div><h2>{current.title}</h2><p>Stage {current.stage+1} · {learningStages[current.stage].title}</p><progress value={mastered} max={learningTopics.length} aria-label="Course completion"/><div className="studio-journey-bottom"><span><strong>{mastered}</strong> lessons completed</span><span>{Math.round(mastered/learningTopics.length*100)}% of your path</span></div></section>
  </header>
  <div className="section-heading dashboard-progress-title"><h2>Your progress</h2><button className="text-button" onClick={()=>navigate('tracker')}><ChartNoAxesCombined size={15}/>Open daily tracker</button></div>
  <div className="dashboard-stats">{metrics.map(({Icon,value,label,note})=><section className="dashboard-stat" key={label}><div className="stat-label"><span>{label}</span><span className="stat-icon"><Icon size={19}/></span></div><strong>{ready?value:'—'}</strong><p>{note}</p></section>)}</div>
  <section className="learning-path-section"><div className="section-heading"><div><h2>Your learning path</h2><p>18 stages. Watch, understand, and tick off each lesson.</p></div><span className="path-overall-progress">{Math.round(mastered/learningTopics.length*100)}% complete</span></div><div className="roadmap-dashboard-grid">{learningStages.map((stage,i)=>{const topics=learningTopics.filter(l=>l.stage===i),done=topics.filter(l=>data.topics[l.id]?.mastered).length,next=topics.find(l=>!data.topics[l.id]?.mastered)||topics[0];return <button className={'roadmap-dashboard-stage '+(done===topics.length?'complete':current.stage===i?'current':'')} key={stage.title} onClick={()=>navigate('learn',next.id)}><span className="roadmap-dashboard-number">{done===topics.length?<CheckCircle2 size={20}/>:String(i+1).padStart(2,'0')}</span><span><strong>{stage.title}</strong><small>{done} / {topics.length} completed · {stage.depth}</small></span></button>})}</div></section>
  <div className="dashboard-support-grid"><section className="white-card playground-entry"><div className="card-title"><Code2 size={19}/><h2>{resume?'Pick up where you left off':'A little practice goes a long way'}</h2></div><p>{resume?resume.exercise.title:`${programCount} programs. Start with an Easy problem in a topic you know.`}</p><button className="secondary" onClick={()=>navigate('practice',resume?.lesson.id||lessons[0].id,resume?.exercise.id||null)}>{resume?'Continue program':'Choose a topic'}<ArrowRight size={14}/></button></section><section className="white-card playground-entry"><div className="card-title"><Terminal size={19}/><h2>Your space to experiment</h2></div><p>Open a blank Java editor. Test a small idea and see what happens.</p><button className="secondary" onClick={()=>navigate('playground')}>Open playground<ArrowRight size={14}/></button></section></div>
  <section className="white-card recent-work"><div className="section-heading"><h2>Recent saved work</h2><button className="text-button" onClick={()=>navigate('practice')}>All practice topics</button></div>{recent.length?<Table><TableHeader><TableRow><TableHead>Problem & topic</TableHead><TableHead>Status</TableHead><TableHead>Last saved</TableHead></TableRow></TableHeader><TableBody>{recent.map(([id,r])=>{const found=findExercise(id)!;return <TableRow key={id}><TableCell><button className="problem-name" onClick={()=>navigate('practice',found.lesson.id,id)}>{found.exercise.title}<small>{found.lesson.title}{!isFoundationExercise(id)?" · Earlier course":""}</small></button></TableCell><TableCell><span className={'status '+r.status}>{r.status==='accepted'?(solved(r,found.exercise)?'Accepted':'Earlier tests'):'In progress'}</span></TableCell><TableCell className="date-cell">{new Date(r.updatedAt!).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</TableCell></TableRow>})}</TableBody></Table>:<div className="dashboard-empty"><Code2 size={25}/><h3>Your practice will appear here</h3><p>Watch a lesson, then open its topic in Practice to begin.</p></div>}</section>
  <div className="dashboard-github"><div><GitBranch size={22}/><div><h3>{data.github.connected?'GitHub connected':'Save your progress to GitHub'}</h3><p>{data.github.connected?`Completed problems save automatically to ${data.github.repo}.`:'Connect your repository in Settings. Each new completed problem saves automatically.'}</p></div></div><button className="secondary" onClick={()=>navigate('settings')}>{data.github.connected?'Manage connection':'Connect GitHub'}</button></div>
  {notes.length>0&&<section className="saved-notes"><div className="section-heading"><h2><NotebookPen size={21}/>My lesson notes</h2><span className="quiet">{notes.length} saved</span></div><div className="notes-grid">{notes.map(l=><article className="white-card" key={l.id}><h3>{l.title}</h3><p>{data.topics[l.id].note}</p><button className="text-button" onClick={()=>navigate('learn',l.id)}>Open lesson</button></article>)}</div></section>}
 </div>;
}
