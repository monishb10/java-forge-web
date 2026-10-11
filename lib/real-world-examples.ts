import raw from './real-world-examples.json';
export type RealWorldExample={title:string;situation:string;steps:{title:string;text:string}[];body:string;output:string;change:string};
export const realWorldExamples=raw as Record<string,RealWorldExample>;
export function realWorldCode(example:RealWorldExample){
 const body=example.body.includes('static void main')?example.body:'public static void main(String[] args) {\n'+example.body.split('\n').map(line=>'    '+line).join('\n')+'\n}';
 return 'import java.util.*;\n\npublic class Main {\n'+body.split('\n').map(line=>'    '+line).join('\n')+'\n}\n';
}
