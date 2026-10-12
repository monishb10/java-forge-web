'use client';
import React,{useEffect,useState} from 'react';
import {BookOpen,Check,CheckCircle2,ChevronLeft,ChevronRight,ExternalLink,FileCode2,Lightbulb,Play,Search,Video} from 'lucide-react';
import {Accordion,AccordionContent,AccordionItem,AccordionTrigger} from '@/components/ui/accordion';
import {Checkbox} from '@/components/ui/checkbox';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {toast} from 'sonner';
import {learningStages} from '@/lib/curriculum';
import {learningTopic,learningTopicById,learningTopics} from '@/lib/lesson-roadmap';
import {lessonVisuals} from '@/lib/lesson-visuals';
import {realWorldCode} from '@/lib/real-world-examples';
import {studyDay} from '@/lib/tracker';
import {JavaSnippet} from './java-snippet';
import {LessonPhotoStory,LessonVisualWalkthrough} from './lesson-visual';
import {useApp} from './shared';

export function CourseOutline({topicId}:{topicId:string}){
 const {data,navigate}=useApp();
 const current=learningTopic(topicId);
 const [search,setSearch]=useState(''),[expanded,setExpanded]=useState(String(current.stage));
 const mastered=learningTopics.filter(topic=>data.topics[topic.id]?.mastered).length;
 const query=search.trim().toLowerCase();
 const visible=learningStages.map((stage,index)=>({...stage,index,visible:stage.topics.filter(id=>!query||stage.title.toLowerCase().includes(query)||learningTopic(id).title.toLowerCase().includes(query))})).filter(stage=>stage.visible.length);
 return <>
  <div className="roadmap-sidebar-intro"><span className="eyebrow">YOUR LEARNING SHEET</span><h2>Java before DSA</h2><p>18 stages. One concept at a time.</p><div className="roadmap-progress-label"><span>{mastered} of {learningTopics.length} lessons understood</span><b>{Math.round(mastered/learningTopics.length*100)}%</b></div><progress value={mastered} max={learningTopics.length} aria-label="Lessons understood"/></div>
  <label className="roadmap-search"><Search size={16}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Find a lesson…" aria-label="Find a lesson"/></label>
  <Accordion type="multiple" value={query?visible.map(stage=>String(stage.index)):expanded?[expanded]:[]} onValueChange={values=>setExpanded(values.at(-1)||'')} className="course-outline roadmap-outline">
   {visible.map(stage=>{const done=stage.topics.every(id=>data.topics[id]?.mastered);return <AccordionItem value={String(stage.index)} key={stage.title}>
    <AccordionTrigger className={'course-phase '+(current.stage===stage.index?'current-course-phase':'')}><span className={'phase-number '+(done?'roadmap-done':'')}>{done?<Check size={14}/>:String(stage.index+1).padStart(2,'0')}</span><span><b>{stage.title}</b><small>{stage.depth}</small></span></AccordionTrigger>
    <AccordionContent><div className="course-topics">{stage.visible.map(id=><button key={id} className={id===topicId?'current':''} aria-current={id===topicId?'page':undefined} onClick={()=>navigate('learn',id)}><span className={'course-index '+(data.topics[id]?.mastered?'complete':'')}>{data.topics[id]?.mastered?<Check size={13}/>:<BookOpen size={13}/>}</span><span>{learningTopic(id).title}</span></button>)}</div></AccordionContent>
   </AccordionItem>})}
  </Accordion>
  {!visible.length&&<p className="roadmap-no-results">No matching lesson. Try “arrays” or “generics”.</p>}
 </>;
}

const steps=[['idea','Understand'],['example','See the example'],['code','Read the code'],['video','Watch a video'],['check','Check understanding']];

export function LessonPage({topicId}:{topicId?:string}){
 const {data,lesson,navigate,saveTopic,exampleDraft,study,ready,lessonStages}=useApp();
 const topic=learningTopic(topicId||lesson.id),saved=data.topics[topic.id]||{},example=topic.example;
 const remembered=lessonStages.current[topic.id];
 const [step,setStep]=useState(steps.some(([id])=>id===remembered)?remembered:remembered==='try'?'check':'idea');
 const [note,setNote]=useState(saved.note||''),[saving,setSaving]=useState(false);
 useEffect(()=>setNote(saved.note||''),[saved.note]);
 const stage=learningStages[topic.stage],index=learningTopics.indexOf(topic),position=steps.findIndex(([id])=>id===step);
 const studied=data.activity.events.some(event=>event.kind==='lesson'&&event.id===topic.id&&studyDay(event.at)===studyDay());
 const choose=(next:string,focus=false)=>{setStep(next);lessonStages.current[topic.id]=next;study.start('lesson');if(focus)requestAnimationFrame(()=>document.getElementById('lesson-stage-heading')?.focus())};
 const runExample=async()=>{exampleDraft.current=realWorldCode(example);await navigate('playground',topic.id)};
 const markStudied=async()=>{setSaving(true);try{if(await saveTopic(topic.id,{read:true,studiedToday:true})){study.pause();toast.success('Lesson added to today’s tracker')}}finally{setSaving(false)}};
 const previous=learningTopics[index-1],next=learningTopics[index+1];
 return <div className="learn-layout guided-reading roadmap-learning">
  <aside className="course-sidebar roadmap-sidebar" aria-label="Learning roadmap"><CourseOutline key={topic.id} topicId={topic.id}/></aside>
  <article className="lesson-page simple-lesson-page roadmap-reader">
   <div className="lesson-breadcrumb"><span>Lessons</span><span>/</span><span>{stage.title}</span></div>
   <header className="simple-lesson-header"><div className="lesson-header-meta"><p className="eyebrow">STAGE {String(topic.stage+1).padStart(2,'0')} OF 18 <span className="roadmap-depth">{stage.depth}</span></p>{(studied||saved.mastered)&&<span className="lesson-study-status"><CheckCircle2 size={14}/>{saved.mastered?'Understood':'Studied today'}</span>}</div><h1>{topic.title}</h1><p>{topic.goal}</p></header>
   <label className="mobile-topic roadmap-mobile-select">Choose a lesson<select value={topic.id} onChange={event=>navigate('learn',event.target.value)} aria-label="Choose lesson">{learningStages.map((stage,i)=><optgroup key={stage.title} label={`${i+1}. ${stage.title}`}>{stage.topics.map(id=><option key={id} value={id}>{learningTopic(id).title}</option>)}</optgroup>)}</select></label>
   <Tabs value={step} onValueChange={choose} className="guided-reading-tabs"><TabsList aria-label="Lesson steps" className="lesson-stage-tabs roadmap-step-tabs">{steps.map(([id,label],i)=><TabsTrigger value={id} key={id}><span>{i+1}</span>{label}</TabsTrigger>)}</TabsList>
    <div className="lesson-reader-card"><div className="lesson-stage-caption">STEP {position+1} OF {steps.length}<span>{steps[position][1]}</span></div><h2 id="lesson-stage-heading" tabIndex={-1}>{step==='idea'?'What does this mean?':step==='example'?example.title:step==='code'?'Connect the idea to Java':step==='video'?'Learn with GeeksforGeeks':'Can you use what you learned?'}</h2>
     <TabsContent value="idea" className="lesson-stage-content">
      <p className="lesson-plain-definition">{topic.idea}</p>
      <section className="roadmap-goals"><h3>What to learn in this topic</h3><ul>{topic.focus.map(goal=><li key={goal}><CheckCircle2 size={15}/>{goal}</li>)}</ul></section>
      <h3 className="lesson-subheading">Three words to know</h3><dl className="lesson-vocabulary">{topic.words.map(([word,meaning])=><div key={word}><dt>{word}</dt><dd>{meaning}</dd></div>)}</dl>
      <div className="roadmap-concepts">{topic.concepts.map((concept,i)=><section className="roadmap-concept" key={concept.title}><div className="roadmap-concept-heading"><span>{String(i+1).padStart(2,'0')}</span><h3>{concept.title}</h3></div><p>{concept.text}</p>{concept.code&&<JavaSnippet code={concept.code}/>}</section>)}</div>
      <div className="lesson-remember-card"><Lightbulb size={20}/><div><h3>Ready to move on when:</h3><p>{topic.ready}</p></div></div>
      {topic.before.some(id=>learningTopicById.has(id))&&<div className="prerequisite-links"><span>Useful refreshers</span>{topic.before.filter(id=>learningTopicById.has(id)&&learningTopics.findIndex(item=>item.id===id)<index).map(id=><button key={id} onClick={()=>navigate('learn',id)}>{learningTopic(id).title}</button>)}</div>}
     </TabsContent>
     <TabsContent value="example" className="lesson-stage-content">
      {lessonVisuals[topic.id]&&!topic.trace?<><LessonPhotoStory topic={topic.id} situation={example.situation}/><LessonVisualWalkthrough topic={topic.id}/></>:<><div className="roadmap-scenario"><span>AN EVERYDAY EXAMPLE</span><p>{example.situation}</p></div><ol className="roadmap-story-steps">{example.steps.map((item,i)=><li key={item.title}><span>{i+1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></li>)}</ol></>}
      {topic.trace&&<div className="roadmap-trace"><h3>Follow it step by step</h3><div className="roadmap-table-scroll"><table><thead><tr>{topic.trace.columns.map(column=><th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{topic.trace.rows.map((row,i)=><tr key={i}>{row.map((value,j)=><td key={j}>{value}</td>)}</tr>)}</tbody></table></div></div>}
      <div className="lesson-mini-example"><span>The result</span><pre>{example.output}</pre><p>Next, see how the Java program produces this result.</p></div>
     </TabsContent>
     <TabsContent value="code" className="lesson-stage-content">
      <p className="lesson-stage-intro">This complete program uses the same example. Predict its output, then run it to check.</p>{topic.runtimeNote&&<p className="roadmap-runtime-note">{topic.runtimeNote}</p>}
      <div className="example-code"><div><FileCode2 size={16}/>Main.java</div><JavaSnippet code={realWorldCode(example)}/></div><div className="expected-output"><span>What this program prints</span><pre>{example.output}</pre></div>
      <h3 className="lesson-subheading">How the code does the job</h3><ol className="lesson-code-explanation">{example.steps.map((item,i)=><li key={item.title}><span>{i+1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></li>)}</ol>
      {topic.stage<2&&<details className="program-frame"><summary>What are Main, main, braces, and println?</summary><ul><li><code>class Main</code> contains this program.</li><li><code>public static void main(String[] args)</code> is its starting method.</li><li>Braces <code>{'{ }'}</code> group code; semicolons end most statements.</li><li><code>System.out.println(...)</code> prints a value and starts a new line.</li></ul></details>}
      <button className="primary lesson-run-example" onClick={runExample}><Play size={16}/>Run this example in Playground</button>
     </TabsContent>
     <TabsContent value="video" className="lesson-stage-content">
      <p className="lesson-stage-intro">Watch the explanation, pause to predict the next step, and return to try the code yourself.</p>
      <div className="roadmap-video-list">{topic.videos.map((video,i)=><a className="roadmap-video-card" key={video.url} href={video.url} target="_blank" rel="noopener noreferrer"><span className="roadmap-video-icon"><Play size={24}/></span><span className="roadmap-video-copy"><small>GEEKSFORGEEKS · VIDEO {i+1}</small><h3>{video.title}</h3><p>{video.focus}</p><b>Watch on {video.url.includes('youtube.com')?'YouTube':'GeeksforGeeks'} <ExternalLink size={14}/></b></span></a>)}</div>
      {!topic.videos.length&&<div className="roadmap-video-empty"><Video size={25}/><p>A topic-specific GeeksforGeeks video hasn’t been verified for this lesson yet. Use the explanation and runnable example here.</p><a href={topic.id==='file-handling'?'https://www.geeksforgeeks.org/java/file-handling-in-java/':'https://dev.java/learn/'} target="_blank" rel="noopener noreferrer">{topic.id==='file-handling'?'Read the GeeksforGeeks file-handling guide':'Open the official Java learning guide'} <ExternalLink size={14}/></a></div>}
      <div className="roadmap-watch-notes"><h3>While you watch</h3><ol><li>Listen for these terms: {topic.words.map(([word])=>word).join(', ')}.</li><li>Pause before the output and predict what will happen.</li><li>Return to the code example and change one value.</li></ol><p>Videos open in a new tab. Opening a video does not mark the lesson complete.</p></div>
     </TabsContent>
     <TabsContent value="check" className="lesson-stage-content">
      <section className="roadmap-recall"><span>QUICK SELF-CHECK</span><h3>{topic.check.question}</h3><details><summary>Reveal the explanation</summary><p>{topic.check.answer}</p></details></section>
      <div className="lesson-change-card"><span>Try it yourself</span><p>{example.change}</p><button className="primary" onClick={runExample}><Play size={16}/>Try in Playground</button></div>
      <div className="lesson-remember-card"><h3>Remember this</h3><p>{topic.remember}</p></div><div className="lesson-mistake-card"><h3>Avoid this mistake</h3><p>{topic.mistake}</p></div>
      <div className="lesson-finish"><div><h3>{studied?'Recorded for today':'Finished studying this lesson?'}</h3><p>{studied?'Your Tracker includes this lesson for today.':'Mark it after you understand the example and have tried the change.'}</p></div><button className="primary" disabled={!ready||saving||studied} onClick={markStudied}><CheckCircle2 size={17}/>{saving?'Saving…':studied?'Studied today':'Mark studied today'}</button></div>
      <label className="check-row"><Checkbox checked={!!saved.mastered} disabled={!ready} onCheckedChange={value=>saveTopic(topic.id,{mastered:!!value,read:!!value||!!saved.read})}/>I understand this concept</label><label className="check-row"><Checkbox checked={!!saved.revise} disabled={!ready} onCheckedChange={value=>saveTopic(topic.id,{revise:!!value})}/>Revisit this topic later</label>
     </TabsContent>
     <div className="lesson-stage-navigation"><button className="secondary" disabled={position===0} onClick={()=>choose(steps[position-1][0],true)}><ChevronLeft size={15}/>Previous step</button><span>{position+1} / {steps.length}</span>{position<steps.length-1?<button className="primary" onClick={()=>choose(steps[position+1][0],true)}>{steps[position+1][1]}<ChevronRight size={15}/></button>:next?<button className="primary" onClick={()=>navigate('learn',next.id)}>Next lesson<ChevronRight size={15}/></button>:<button className="primary" onClick={()=>navigate('tracker')}>Open Tracker</button>}</div>
    </div>
   </Tabs>
   <details className="roadmap-notes"><summary>My notes for this lesson</summary><label className="field-label" htmlFor="lesson-note">Save what made the concept click</label><textarea id="lesson-note" rows={4} value={note} onChange={event=>setNote(event.target.value)} placeholder="A useful rule, a small example, or something to revisit…"/><button className="secondary" disabled={!ready} onClick={async()=>{if(await saveTopic(topic.id,{note}))toast.success('Note saved')}}>Save note</button></details>
   <nav className="roadmap-topic-navigation" aria-label="Previous and next lessons">{previous?<button onClick={()=>navigate('learn',previous.id)}><ChevronLeft size={17}/><span><small>Previous lesson</small>{previous.title}</span></button>:<span/>}{next&&<button onClick={()=>navigate('learn',next.id)}><span><small>Next lesson</small>{next.title}</span><ChevronRight size={17}/></button>}</nav>
  </article>
 </div>;
}
