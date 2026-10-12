'use client';
import React,{useState} from 'react';
import {ArrowLeft,ArrowRight,Check,ChevronDown,ExternalLink,GraduationCap,LoaderCircle,Play,Search,Video} from 'lucide-react';
import {toast} from 'sonner';
import {learningStages} from '@/lib/curriculum';
import {learningTopic,learningTopics} from '@/lib/lesson-roadmap';
import {youtubeSource} from '@/lib/lesson-media';
import {useApp} from './shared';

export function CourseOutline({topicId}:{topicId:string}){
 const {data,navigate}=useApp();
 const current=learningTopic(topicId);
 const [search,setSearch]=useState('');
 const [expanded,setExpanded]=useState(current.stage);
 const completed=learningTopics.filter(topic=>data.topics[topic.id]?.mastered).length;
 const query=search.trim().toLowerCase();
 const visible=learningStages.map((stage,index)=>({...stage,index,visible:stage.topics.filter(id=>!query||stage.title.toLowerCase().includes(query)||learningTopic(id).title.toLowerCase().includes(query))})).filter(stage=>stage.visible.length);
 return <>
  <div className="classroom-outline-heading"><div><GraduationCap size={19}/><h2>Your learning path</h2></div><span>{completed}/{learningTopics.length}</span></div>
  <div className="classroom-course-progress"><progress max={learningTopics.length} value={completed} aria-label="Lessons completed"/><span>{Math.round(completed/learningTopics.length*100)}% complete</span></div>
  <label className="classroom-search"><Search size={16}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Find a lesson" aria-label="Find a lesson"/></label>
  <div className="classroom-module-list">
   {visible.map(stage=>{const open=!!query||expanded===stage.index;const done=stage.topics.filter(id=>data.topics[id]?.mastered).length;return <section className={'classroom-module '+(current.stage===stage.index?'current-module':'')} key={stage.title}>
    <button className="classroom-module-trigger" aria-expanded={open} aria-controls={'module-'+stage.index} onClick={()=>setExpanded(open?-1:stage.index)}><span className="module-number">{String(stage.index+1).padStart(2,'0')}</span><span><b>{stage.title}</b><small>{done}/{stage.topics.length} completed</small></span><ChevronDown size={15} className={open?'rotated':''}/></button>
    {open&&<div id={'module-'+stage.index} className="classroom-module-lessons">{stage.visible.map(id=><button key={id} className={'classroom-lesson-link '+(id===topicId?'selected':'')} aria-current={id===topicId?'page':undefined} onClick={()=>navigate('learn',id)}><span className={'lesson-state-icon '+(data.topics[id]?.mastered?'is-complete':'')}>{data.topics[id]?.mastered?<Check size={13}/>:<Play size={12}/>}</span><span>{learningTopic(id).title}</span>{id===topicId&&<span className="lesson-current-dot"/>}</button>)}</div>}
   </section>})}
   {!visible.length&&<p className="classroom-no-results">No matching lessons.</p>}
  </div>
 </>;
}

export function LessonPage({topicId}:{topicId?:string}){
 const {data,lesson,navigate,saveTopic,study,ready}=useApp();
 const topic=learningTopic(topicId||lesson.id),index=learningTopics.indexOf(topic),completed=!!data.topics[topic.id]?.mastered;
 const [selected,setSelected]=useState(0),[playing,setPlaying]=useState(false),[saving,setSaving]=useState(false);
 const video=topic.videos[selected],source=video?youtubeSource(video.url):null;
 const provider=video?(source?'YouTube':'GeeksforGeeks'):'Learning guide';
 const stage=learningStages[topic.stage],next=learningTopics[index+1],previous=learningTopics[index-1];
 const toggleComplete=async()=>{
  if(!ready||saving)return;
  setSaving(true);
  try{
   const nextComplete=!completed;
   if(await saveTopic(topic.id,{mastered:nextComplete,read:nextComplete||!!data.topics[topic.id]?.read,studiedToday:nextComplete})){
    if(nextComplete){study.pause();toast.success('Lesson completed. Progress saved.');}
    else toast('Lesson marked as incomplete.');
   }
  }finally{setSaving(false);}
 };
 const selectVideo=(i:number)=>{setSelected(i);setPlaying(false);};
 return <div className="video-classroom">
  <div className="classroom-main">
   <div className="classroom-breadcrumb"><span>THE CLASSROOM</span><span>/</span><span>Stage {String(topic.stage+1).padStart(2,'0')}</span><span>/</span><span>{stage.title}</span></div>
   <header className="classroom-title"><div><span className="studio-kicker">THE CLASSROOM / LESSON {String(index+1).padStart(2,'0')}</span><h1>{topic.title}</h1></div><span className={'classroom-status '+(completed?'complete':'')}><span/>{completed?'Completed':'In progress'}</span></header>
   <div className="classroom-player-shell">
    <div className="classroom-player-bar"><span><Video size={15}/>Video lesson</span><span>{provider}</span></div>
    <div className={'classroom-player '+(source?'has-poster ':'')+(playing&&source?'is-playing':'')}>
     {playing&&source?<iframe key={video.url} src={source.embed+'&autoplay=1'} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<>
      {source&&<img className="classroom-video-poster" src={source.thumbnail} alt=""/>}
      <div className="classroom-player-shade"/>
      <div className="classroom-player-content"><span className="player-provider">{video?provider.toUpperCase()+' · VIDEO LESSON':'JAVA FOUNDATIONS'}</span>
       {video?source?<button className="classroom-play-button" aria-label="Play lesson video" onClick={()=>{setPlaying(true);study.start('lesson');}}><Play size={28} fill="currentColor"/></button>:<a className="classroom-play-button" aria-label="Watch lesson on GeeksforGeeks" href={video.url} target="_blank" rel="noopener noreferrer" onClick={()=>study.start('lesson')}><Play size={28} fill="currentColor"/></a>:<Video size={42}/>}
       <h2>{topic.title}</h2><p>{source?'Press play. Learn at your pace.':video?'Watch this lesson on GeeksforGeeks.':'A video is not available for this topic yet.'}</p>
       {!video&&<a className="secondary" href="https://www.geeksforgeeks.org/java/file-handling-in-java/" target="_blank" rel="noopener noreferrer">Open the learning guide <ExternalLink size={14}/></a>}
      </div>
     </>}
    </div>
    <div className="classroom-video-caption"><span>{video?.title||'File handling in Java'}</span>{video&&<a href={video.url} target="_blank" rel="noopener noreferrer">Open on {source?'YouTube':'GFG'} <ExternalLink size={13}/></a>}</div>
   </div>
   {topic.videos.length>1&&<div className="classroom-video-options" aria-label="Choose lesson video">{topic.videos.map((item,i)=><button key={item.url} aria-pressed={selected===i} onClick={()=>selectVideo(i)}><span><Play size={12}/>Video {i+1}</span><b>{item.title}</b>{selected===i&&<span className="video-selected-label">Selected</span>}</button>)}</div>}
   <section className="classroom-learning-goal"><h2>What you’ll learn</h2><p>{video?.focus||topic.goal}</p></section>
   <div className={'classroom-completion '+(completed?'is-complete':'')}>
    <label><input type="checkbox" checked={completed} disabled={!ready||saving} onChange={toggleComplete}/><span className="completion-check" aria-hidden="true">{saving?<LoaderCircle size={18} className="spin"/>:completed?<Check size={18}/>:null}</span><span><strong>{saving?'Saving…':completed?'Lesson completed':'Mark lesson complete'}</strong><small>{completed?'Saved to your progress. You can untick to revisit.':'Tick when you have watched and understood the lesson.'}</small></span></label>
    {next&&<button className="primary" disabled={saving} onClick={()=>navigate('learn',next.id)}>Next lesson <ArrowRight size={16}/></button>}
   </div>
   <nav className="classroom-lesson-navigation" aria-label="Lesson navigation">{previous?<button onClick={()=>navigate('learn',previous.id)}><ArrowLeft size={15}/><span><small>Previous</small>{previous.title}</span></button>:<span/>}{next?<button onClick={()=>navigate('learn',next.id)}><span><small>Up next</small>{next.title}</span><ArrowRight size={15}/></button>:<button onClick={()=>navigate('tracker')}>View your progress <ArrowRight size={15}/></button>}</nav>
  </div>
  <aside className="classroom-outline" aria-label="Learning roadmap"><CourseOutline key={topic.id} topicId={topic.id}/></aside>
 </div>;
}
