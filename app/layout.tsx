import type { Metadata } from 'next';
import './globals.css';
import './lesson-visuals.css';
import './tracker-lessons.css';
import './playground-terminal.css';
import './workspace-polish.css';
import './foundation.css';
import './account.css';
import './lesson-roadmap.css';
export const metadata: Metadata = {
 title: 'Java Forge — Java Foundations for DSA',
 description: 'Follow an 18-stage Java roadmap with clear lessons, everyday examples, GeeksforGeeks videos, and 640 coding programs before DSA.',
 icons: {icon:'/favicon.svg',shortcut:'/favicon.svg'}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preload" href="/fonts/inter-400.woff" as="font" type="font/woff" crossOrigin="anonymous"/><link rel="preload" href="/fonts/plus-jakarta-sans-700.woff" as="font" type="font/woff" crossOrigin="anonymous"/></head><body>{children}</body></html>}
