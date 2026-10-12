'use client';
import React, {useEffect, useState} from 'react';
import {BookOpen, Code2, GitBranch, LoaderCircle, ChartNoAxesCombined, ArrowRight, UserRound} from 'lucide-react';
import type {Account} from '@/lib/auth';
import {setSessionAccount} from '@/lib/session-client';
import Workspace from './workspace';

export default function AccountGate() {
  const [user,setUser]=useState<Account|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError('');
    fetch('/api/account',{cache:'no-store',signal:controller.signal})
      .then(async response=>{const result=await response.json() as {user:Account|null;error?:string};if(!response.ok)throw new Error(result.error||'Could not check your account.');return result;})
      .then(result=>{if(controller.signal.aborted)return;setSessionAccount(result.user?.id||null);setUser(result.user);})
      .catch(e=>{if(!controller.signal.aborted)setError(e.message||'Could not check your account.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[retry]);
  if(user)return <Workspace account={user}/>;
  return <main className="account-page">
    <a className="account-brand" href="/"><span><Code2 size={24}/></span>JAVA FORGE</a>
    <section className="account-card" aria-labelledby="sign-in-heading">
      <div className="account-intro"><span className="account-eyebrow">JAVA FOUNDATIONS FOR DSA</span>
        <h1 id="sign-in-heading">Your learning.<br/><span>Your progress.</span></h1>
        <p>Watch a lesson. Write a program. Build your Java foundation, one small step at a time.</p>
        <ul className="account-benefits"><li><BookOpen/><div><strong>Learn with focused videos</strong><span>29 lessons. One clear learning path.</span></div></li><li><Code2/><div><strong>Practise from a blank editor</strong><span>640 programs with 64 test cases each.</span></div></li><li><ChartNoAxesCombined/><div><strong>See your daily progress</strong><span>Your lessons, programs, and study history.</span></div></li></ul>
      </div>
      <div className="account-signin"><div className="account-symbol"><UserRound size={28}/></div><h2>Your next chapter starts here.</h2><p>Sign in with your own GitHub account. Your progress stays separate from everyone else’s.</p>
        {loading?<p className="account-loading" role="status"><LoaderCircle className="spin" size={18}/>Checking your account…</p>:error?<div role="alert" className="account-error"><p>{error}</p><button onClick={()=>setRetry(r=>r+1)}>Try again</button></div>:<a className="account-primary" href="/auth/github"><GitBranch size={19}/>Continue with GitHub<ArrowRight size={17}/></a>}
        <p className="account-note">Sign-in reads your GitHub profile. You can connect a repository for your accepted solutions later in Settings.</p>
      </div>
    </section>
    <p className="account-footer">Learn Java. Build logic. Get ready for DSA.</p>
  </main>;
}
