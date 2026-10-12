type FocusDocument=Pick<Document,'visibilityState'|'hasFocus'|'addEventListener'|'removeEventListener'>;
type FocusWindow=Pick<Window,'addEventListener'|'removeEventListener'|'setTimeout'|'clearTimeout'|'setInterval'|'clearInterval'>;

/** Observe whether a running study session still belongs to the visible page. */
export function watchStudyFocus(pause:()=>void,isRunning:()=>boolean,doc:FocusDocument=document,win:FocusWindow=window){
 let blurTimer:number|undefined;
 const checkFocus=()=>{if(isRunning()&&(doc.visibilityState!=='visible'||!doc.hasFocus()))pause()};
 // A focused child iframe blurs the outer window without leaving this document.
 // Wait for the focus transfer to settle before deciding to pause.
 const blur=()=>{win.clearTimeout(blurTimer);blurTimer=win.setTimeout(()=>{blurTimer=undefined;checkFocus()},0)};
 // Leaving the browser while a child frame owns focus may not blur us again.
 const focusTimer=win.setInterval(checkFocus,1000);
 const hidden=()=>{if(doc.visibilityState==='hidden')pause()};
 doc.addEventListener('visibilitychange',hidden);win.addEventListener('pagehide',pause);win.addEventListener('blur',blur);
 return()=>{win.clearTimeout(blurTimer);win.clearInterval(focusTimer);doc.removeEventListener('visibilitychange',hidden);win.removeEventListener('pagehide',pause);win.removeEventListener('blur',blur)};
}
