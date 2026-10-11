import raw from './lesson-guides.json';
export type LessonGuide={goal:string;idea:string;use:string;before:string[];steps:{title:string;text:string;code?:string}[];trace:{columns:string[];rows:string[][]};remember:string;mistake?:string;check:{question:string;answer:string}};
export const lessonGuides=raw as Record<string,LessonGuide>;
