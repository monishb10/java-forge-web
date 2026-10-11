import raw from './curriculum.json';
import rawBank from './practice-bank.json';
import legacyBank from './legacy-practice-bank.json';
export type PracticeExample={input:string;output:string;explanation:string;label?:string};
export type ProblemDetails={requirements:string[];input:string[];output:string;constraints:string[];examples:PracticeExample[];checks:string[]};
export type Drill={title:string;task:string;guide:string;details?:ProblemDetails};
export type TestCase={input:string;output:string;label?:string;strictWhitespace?:boolean};
export type Lesson={id:string;title:string;phase:number;summary:string;sections:{title:string;text:string}[];body:string;output:string;walkthrough:string[];pitfall:string;complexity:string;recall?:{title:string;task:string};challenge:{title:string;task:string;format:string;tests:TestCase[];suiteVersion?:string;hint:string;details?:ProblemDetails};drills:Drill[];questions:{q:string;a:string}[]};
export const foundationOrder=['variables','input-output','operators','conditions','loops','methods','arrays','strings','oop','recursion-basics','stringbuilder','arraylist','linkedlist-api','hashmap','hashset','deque-api','queue-api','priorityqueue','comparator','collections'];
const originalLessons=raw as Lesson[];
export const lessons=foundationOrder.map((id,index)=>({...originalLessons.find(l=>l.id===id)!,phase:index<4?0:index<8?1:index<12?2:3}));
export const allLessons=originalLessons.map(l=>lessons.find(active=>active.id===l.id)||{...l,phase:0});
export const foundationProgramsPerTopic=32;
export const foundationTestsPerProgram=64;
export const phases=[
 {name:'Your first programs',label:'Start here',description:'Store values, read input, calculate answers, and make decisions.',color:'#2267CD'},
 {name:'Work with data',label:'Build your logic',description:'Repeat steps, write methods, and work through arrays and strings.',color:'#2267CD'},
 {name:'Organize your code',label:'Make Java click',description:'Use objects, basic recursion, text builders, and growing lists.',color:'#2267CD'},
 {name:'Collections for DSA',label:'Build your toolkit',description:'Choose the right Java collection and understand how its operations behave.',color:'#2267CD'}
];
// New editors are deliberately empty. Only a learner's own draft, or a lesson
// example they explicitly choose to open in Playground, may populate them.
export const starter='';
const oldStarter='import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input, solve the problem, and print the result.\n        \n    }\n}\n';
const oldRectangleStarter=oldStarter.replace('// Read input, solve the problem, and print the result.', 'long width = sc.nextLong();\n        long height = sc.nextLong();\n        // Calculate the area, then print it with System.out.println(...).');
export function editorDraft(saved:string|undefined,initial=''){if(saved===undefined)return initial;const compact=(s:string)=>s.replace(/\s/g,'');return [oldStarter,oldRectangleStarter].some(s=>compact(s)===compact(saved))?'':saved;}
export function exampleCode(l:Lesson){return 'import java.util.*;\n\npublic class Main {\n'+(l.body.includes('static void main')?l.body:'    public static void main(String[] args) {\n'+l.body.split('\n').map(x=>'        '+x).join('\n')+'\n    }')+'\n}\n';}
export type Exercise={id:string;title:string;kind:'code';skills?:string[];difficulty:'Easy'|'Medium'|'Hard';task:string;tests:TestCase[];suiteVersion:string;hint:string;details:ProblemDetails};
const practiceBank=rawBank as Record<string,Exercise[]>;
const earlierBank=legacyBank as Record<string,Exercise[]>;
export const earlierExercises=(l:Lesson):Exercise[]=>earlierBank[l.id]||[];
export const isFoundationExercise=(id:string)=>id.includes('-foundation-');
// One stable easy-to-hard order for the topic list and Previous/Next navigation.
// Work is saved by problem ID, so reordering never changes a learner's draft or result.
export function exercises(l:Lesson):Exercise[]{const rank={Easy:0,Medium:1,Hard:2};return [...(practiceBank[l.id]||[])].sort((a,b)=>rank[a.difficulty]-rank[b.difficulty]);}
const exerciseIndex=new Map([...allLessons.flatMap(lesson=>earlierExercises(lesson).map(exercise=>[exercise.id,{lesson,exercise}] as const)),...lessons.flatMap(lesson=>exercises(lesson).map(exercise=>[exercise.id,{lesson,exercise}] as const))]);
export const programCount=lessons.reduce((sum,l)=>sum+exercises(l).length,0);
export function findExercise(id:string){return exerciseIndex.get(id)||null;}
