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
// Learning follows the uploaded 18-stage sheet. Practice keeps its stable
// topic/problem IDs so existing accepted programs and drafts remain valid.
export const learningStages=[
 {title:'Java Basics & Environment',description:'Understand how Java runs, then read and print your first values.',topics:['java-environment','input-output'],depth:'Core for DSA'},
 {title:'Variables & Data Types',description:'Store values, choose types, and convert them safely.',topics:['variables'],depth:'Core for DSA'},
 {title:'Operators',description:'Calculate results and build clear expressions.',topics:['operators'],depth:'Core for DSA'},
 {title:'Control Flow',description:'Choose the right action with conditions and switch.',topics:['conditions'],depth:'Core for DSA'},
 {title:'Loops',description:'Repeat a task and trace each iteration.',topics:['loops'],depth:'Core for DSA'},
 {title:'Functions / Methods',description:'Break a program into small, reusable jobs.',topics:['methods'],depth:'Core for DSA'},
 {title:'Arrays',description:'Traverse and update one- and two-dimensional data.',topics:['arrays'],depth:'Core for DSA'},
 {title:'Strings',description:'Read text and build new text with StringBuilder.',topics:['strings','stringbuilder'],depth:'Core for DSA'},
 {title:'Object-Oriented Programming',description:'Model state and behavior with classes and objects.',topics:['oop'],depth:'Core for DSA'},
 {title:'Exception Handling',description:'Understand failures and recover where appropriate.',topics:['exception-handling'],depth:'Useful Java'},
 {title:'Collections Framework',description:'Choose lists, sets, maps, queues, and ordering tools.',topics:['collections-framework','arraylist','linkedlist-api','hashmap','hashset','deque-api','queue-api','priorityqueue','comparator','collections'],depth:'Core for DSA'},
 {title:'Generics',description:'Write reusable classes and methods with type safety.',topics:['generics'],depth:'Useful Java'},
 {title:'Recursion',description:'Solve a smaller task and understand the call stack.',topics:['recursion-basics'],depth:'Core for DSA'},
 {title:'File Handling',description:'Read and write text while managing resources.',topics:['file-handling'],depth:'Useful Java'},
 {title:'Time & Space Complexity',description:'Compare how work and memory grow with input.',topics:['complexity'],depth:'Core for DSA'},
 {title:'Multithreading & Concurrency',description:'Learn tasks, threads, joining, and shared state.',topics:['multithreading'],depth:'After basics'},
 {title:'Java 8+ Features',description:'Read lambdas, functional interfaces, and stream pipelines.',topics:['java8-features'],depth:'After basics'},
 {title:'Final Practice & Review',description:'Combine your Java skills and prepare to start DSA.',topics:['final-review'],depth:'Ready for DSA'}
];
export const learningTopicIds=learningStages.flatMap(stage=>stage.topics);
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
