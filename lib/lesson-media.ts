export type YoutubeSource={id:string;start:number;embed:string;thumbnail:string};

/** Only trusted YouTube IDs may become iframe sources. */
export function youtubeSource(value:string):YoutubeSource|null {
 try {
  const url=new URL(value);
  if(url.protocol!=='https:')return null;
  const host=url.hostname.toLowerCase();
  const id=host==='youtu.be'?url.pathname.slice(1):['www.youtube.com','youtube.com'].includes(host)&&url.pathname==='/watch'?url.searchParams.get('v'):null;
  if(!id||!/^[-\w]{11}$/.test(id))return null;
  const time=url.searchParams.get('start')||url.searchParams.get('t')||'0';
  const units=time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  const seconds=/^\d+$/.test(time)?Number(time):units?Number(units[1]||0)*3600+Number(units[2]||0)*60+Number(units[3]||0):0;
  const start=Number.isSafeInteger(seconds)&&seconds>=0&&seconds<=86400?seconds:0;
  return {id,start,embed:`https://www.youtube-nocookie.com/embed/${id}?rel=0&start=${start}`,thumbnail:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`};
 }catch{return null;}
}
