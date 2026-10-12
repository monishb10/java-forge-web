import type { Metadata } from 'next';
import './globals.css';
import './tracker-lessons.css';
import './playground-terminal.css';
import './workspace-polish.css';
import './foundation.css';
import './account.css';
import './studio.css';
export const metadata: Metadata = {
 title: 'Java Forge — Java Foundations for DSA',
 description: 'Follow an 18-stage Java roadmap with video lessons, simple completion tracking, and 640 coding programs before DSA.',
 icons: {icon:'/favicon.svg',shortcut:'/favicon.svg'}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className="dark"><head><link rel="preload" href="/fonts/inter-400.woff" as="font" type="font/woff" crossOrigin="anonymous"/><link rel="preload" href="/fonts/plus-jakarta-sans-700.woff" as="font" type="font/woff" crossOrigin="anonymous"/></head><body>{children}</body></html>}
