/** A clock measures only explicitly active time. Paused intervals never accrue. */
export class PracticeClock {
 private accumulated=0;
 private startedAt:number|null=null;
 constructor(elapsedMs=0){this.accumulated=Math.max(0,elapsedMs)}
 get running(){return this.startedAt!==null}
 total(now=Date.now()){return Math.floor(this.accumulated+(this.startedAt===null?0:Math.max(0,now-this.startedAt)))}
 resume(now=Date.now()){if(this.startedAt===null)this.startedAt=now}
 pause(now=Date.now()){this.accumulated=this.total(now);this.startedAt=null;return this.accumulated}
}
export function formatPracticeTime(ms:number){
 const seconds=Math.floor(Math.max(0,ms)/1000),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),rest=seconds%60;
 return hours?`${hours}h ${String(minutes).padStart(2,'0')}m`:`${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`;
}
export function formatTimer(ms:number){
 const seconds=Math.floor(Math.max(0,ms)/1000),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),rest=seconds%60;
 return `${hours?String(hours).padStart(2,'0')+':':''}${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`;
}
