'use client';
import React,{useId,useState} from 'react';
import {ArrowRight,ChevronLeft,ChevronRight,RotateCcw,ScanEye} from 'lucide-react';
import {lessonVisuals,VisualFrame,VisualNetwork,PhotoKey} from '@/lib/lesson-visuals';
import rawPhotos from '@/lib/lesson-photos.json';
import {JavaSnippet} from './java-snippet';

type LessonPhoto={src:string;alt:string;width:number;height:number;sourcePage:string;photographer:string};
const photos=rawPhotos as Record<PhotoKey,LessonPhoto>;

export function LessonPhotoStory({topic,situation}:{topic:string;situation:string}){
 const visual=lessonVisuals[topic],photo=photos[visual.photo];
 const[unavailable,setUnavailable]=useState(false);
 return <>
  <div className="lesson-story">
   <figure className="lesson-photo">
    {unavailable?<div className="lesson-photo-unavailable"><ScanEye size={26}/><span>{photo.alt}</span></div>:<img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async" onError={()=>setUnavailable(true)}/>}
    <figcaption>Photo by <a href={photo.sourcePage} target="_blank" rel="noreferrer">{photo.photographer} / Pexels</a></figcaption>
   </figure>
   <div className="lesson-story-copy"><span className="story-label">Picture this</span><p className="scenario-intro">{situation}</p><p className="story-connection">{visual.caption}</p></div>
  </div>
  <div className="concept-bridge"><h3>Connect everyday life to Java</h3><div className="concept-bridge-grid">{visual.connections.map(([everyday,java])=><div className="concept-bridge-item" key={everyday}><span>{everyday}</span><ArrowRight size={16} aria-hidden="true"/><code>{java}</code></div>)}</div></div>
 </>;
}

function Network({network}:{network:VisualNetwork}){
 const marker=useId().replace(/:/g,''),title=useId();
 const description=network.edges.map(([a,b])=>`${network.nodes.find(n=>n.id===a)?.label} connects to ${network.nodes.find(n=>n.id===b)?.label}`).join('. ')+'. Highlighted: '+(network.nodes.filter(n=>n.active).map(n=>n.label).join(', ')||'none')+'.';
 return <div className="lesson-network"><svg viewBox="0 0 600 215" role="img" aria-labelledby={title}>
  <title id={title}>{description}</title>
  <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M 0 0 L 7 3.5 L 0 7 z" fill="#6F8BAA"/></marker></defs>
  {network.edges.map(([from,to])=>{const a=network.nodes.find(n=>n.id===from)!,b=network.nodes.find(n=>n.id===to)!,dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy),edge=Math.min(64/Math.abs(dx),25/Math.abs(dy)),start=edge+2/d,end=edge+6/d;return <line key={from+'-'+to} x1={a.x+dx*start} y1={a.y+dy*start} x2={b.x-dx*end} y2={b.y-dy*end} stroke="#6F8BAA" strokeWidth="2" markerEnd={`url(#${marker})`}/>})}
  {network.nodes.map(n=><g key={n.id} className={n.active?'network-node active':'network-node'}><rect x={n.x-64} y={n.y-25} width="128" height="50" rx="9"/><text x={n.x} y={n.y+5} textAnchor="middle">{n.label}</text>{n.active&&<circle cx={n.x+55} cy={n.y-18} r="4"/>}</g>)}
 </svg></div>;
}

export function LessonFrame({frame}:{frame:VisualFrame}){
 return <>
  <div className="visual-step-explanation" aria-live="polite" aria-atomic="true"><h4>{frame.title}</h4><p>{frame.text}</p></div>
  <div className="visual-stage">
   {frame.network&&<Network network={frame.network}/>}
   {frame.rows.map((row,i)=><div className="visual-row" key={i}><p className="visual-row-label">{row.label}</p><div className={'visual-cells'+(row.linked?' linked':'')}>{row.cells.length?row.cells.map((cell,j)=><React.Fragment key={j}><div className={'visual-cell'+(cell.active?' active':'')}><span>{cell.label}</span><b>{cell.value}</b>{cell.active&&<span className="sr-only">Highlighted in this step</span>}</div>{row.linked&&j<row.cells.length-1&&<ArrowRight className="cell-arrow" size={19} aria-hidden="true"/>}</React.Fragment>):<span className="visual-empty">Empty — no items</span>}</div></div>)}
   <p className="visual-legend"><span aria-hidden="true"/>Outlined values are used or changed in this step.</p>
  </div>
  <div className="visual-java"><span>Java behind this step · excerpt</span><JavaSnippet code={frame.code}/></div>
  {frame.note&&<p className="visual-note">{frame.note}</p>}
 </>;
}

export function LessonVisualWalkthrough({topic}:{topic:string}){
 const visual=lessonVisuals[topic],frames=visual.frames,[step,setStep]=useState(0),region=useId();
 const last=step===frames.length-1;
 return <section className="lesson-visual-walkthrough" aria-label="Interactive example walkthrough">
  <div className="visual-walkthrough-heading"><span className="visual-icon"><ScanEye size={21}/></span><div><h3>See the idea in action</h3><p>Use Next step to follow the example at your own pace.</p></div><span className="visual-step-count">{step+1} / {frames.length}</span></div>
  <div className="visual-step-track" aria-label="Example steps">{frames.map((f,i)=><button key={i} type="button" className={i===step?'current':i<step?'visited':''} aria-label={`Step ${i+1}: ${f.title}`} aria-current={step===i?'step':undefined} aria-controls={region} onClick={()=>setStep(i)}><span>{i+1}</span></button>)}</div>
  <div id={region}><LessonFrame frame={frames[step]}/></div>
  <div className="visual-controls"><button type="button" className="secondary" onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} aria-controls={region}><ChevronLeft size={17}/>Previous</button><button type="button" className="visual-restart" onClick={()=>setStep(0)} disabled={step===0} aria-controls={region}><RotateCcw size={15}/>Restart</button><button type="button" className="primary" onClick={()=>setStep(s=>Math.min(frames.length-1,s+1))} disabled={last} aria-controls={region}>{last?'Example complete':'Next step'}{!last&&<ChevronRight size={17}/>}</button></div>
 </section>;
}
