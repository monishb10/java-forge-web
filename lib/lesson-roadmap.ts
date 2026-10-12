import rawLessons from './curriculum.json';
import extraLessons from './roadmap-extra-lessons.json';
import rawVideos from './lesson-videos.json';
import {learningStages} from './curriculum';
import {simpleLessons} from './simple-lessons';
import {lessonGuides} from './lesson-guides';
import {foundationGuides} from './foundation-guides';
import {realWorldExamples, type RealWorldExample} from './real-world-examples';
import {coreConcepts, type LessonConcept} from './lesson-concepts';

export type LessonVideo={title:string;url:string;focus:string};
export type LearningTopic={
 id:string;title:string;stage:number;goal:string;idea:string;words:[string,string][];
 focus:string[];ready:string;remember:string;mistake:string;before:string[];
 concepts:LessonConcept[];example:RealWorldExample;
 trace?:{columns:string[];rows:string[][]};check:{question:string;answer:string};
 runtimeNote?:string;videos:LessonVideo[];
};
type ExtraTopic=Omit<LearningTopic,'id'|'stage'|'videos'>;
const extras:Record<string,Omit<ExtraTopic,'words'> & {words:string[][]}>=extraLessons;
const videos=rawVideos as Record<string,LessonVideo[]>;

export const learningTopics:LearningTopic[]=learningStages.flatMap((stage,index)=>stage.topics.map(id=>{
 if(extras[id])return {...extras[id],words:extras[id].words.map(([word,meaning]):[string,string]=>[word,meaning]),id,stage:index,videos:videos[id]||[]};
 const lesson=rawLessons.find(item=>item.id===id)!;
 const simple=simpleLessons[id],guide=lessonGuides[id],foundation=foundationGuides[id];
 return {id,title:lesson.title,stage:index,goal:guide.goal,idea:simple.idea,words:simple.words,
  focus:coreConcepts[id].map(concept=>concept.title),ready:foundation.ready,
  remember:simple.remember,mistake:simple.mistake,before:guide.before,
  concepts:coreConcepts[id],example:realWorldExamples[id],check:guide.check,videos:videos[id]||[]};
}));
export const learningTopicById=new Map(learningTopics.map(topic=>[topic.id,topic]));
export function learningTopic(id:string){return learningTopicById.get(id)||learningTopics[0];}

