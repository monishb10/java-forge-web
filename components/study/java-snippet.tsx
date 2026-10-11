import React from 'react';

const keywords=new Set('abstract assert break case catch class const continue default do else enum extends final finally for if implements import instanceof interface native new package private protected public return static strictfp super switch synchronized this throw throws transient try volatile while var record sealed permits yield'.split(' '));
const types=new Set('boolean byte char double float int long short void'.split(' '));

/** Present Java as selectable text. React escapes every token and preserves the source. */
export function JavaSnippet({code}:{code:string}){
 const pieces:React.ReactNode[]=[];
 const tokens=/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(?:0[xX][\dA-Fa-f_]+|\d[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?\d+)?[fFdDlL]?)\b|\b[A-Za-z_$][\w$]*\b/g;
 let end=0;
 for(const match of code.matchAll(tokens)){
  const at=match.index!,value=match[0];
  if(at>end)pieces.push(code.slice(end,at));
  const kind=match[1]?'comment':match[2]?'string':/^\d/.test(value)?'number':types.has(value)?'type':keywords.has(value)?'keyword':/^(true|false|null)$/.test(value)?'literal':/^[A-Z]/.test(value)?'type':/^\s*\(/.test(code.slice(at+value.length))?'method':'';
  pieces.push(kind?<span className={'java-'+kind} key={at}>{value}</span>:value);
  end=at+value.length;
 }
 if(end<code.length)pieces.push(code.slice(end));
 return <pre className="java-snippet" aria-label="Java code"><code>{pieces}</code></pre>;
}
