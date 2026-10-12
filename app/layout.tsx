import type { Metadata } from 'next';
import './globals.css';
import './tracker-lessons.css';
import './playground-terminal.css';
import './workspace-polish.css';
import './foundation.css';
import './account.css';
import './studio.css';
import './tracker-editorial.css';
export const metadata: Metadata = {
 title: 'Java Forge — Java Foundations for DSA',
 description: 'Follow an 18-stage Java roadmap with video lessons, simple completion tracking, and 640 coding programs before DSA.',
 icons: {icon:'/favicon.svg',shortcut:'/favicon.svg'}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className="editorial-theme"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap"/></head><body>{children}</body></html>}
