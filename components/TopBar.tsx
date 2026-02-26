'use client';

import { useState, useEffect } from 'react';
import { Menu, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import GlobalSearch from './GlobalSearch';

export default function TopBar() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = time ? time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).replace(/,/g, '') : '...';
  const timeStr = time ? time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';
  const timeZoneOffset = time ? -time.getTimezoneOffset() / 60 : 0;
  const timeZoneStr = time ? `${timeZoneOffset >= 0 ? '+' : '-'}${String(Math.abs(timeZoneOffset)).padStart(2, '0')}:00` : '';
  const timeZoneName = time ? Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' ') : '';

  return (
    <header className="h-[48px] flex items-center justify-between border-b border-dt-border bg-[#0b0c10] pl-3 pr-4 shrink-0 fixed top-0 left-10 right-0 z-30 transition-all">
      <div className="flex items-center gap-3">
        <button className="text-dt-text-secondary hover:text-white transition-colors">
          <Menu size={18} />
        </button>
        
        <Link href="/" className="flex items-center gap-2 pr-4 border-r border-[#22232b] group">
          <div className="relative flex items-center justify-center w-6 h-6">
            <svg viewBox="0 0 100 100" className="w-full h-full text-dt-orange animate-[spin_10s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="6">
              <circle cx="50" cy="50" r="40" strokeOpacity="0.3" />
              <path d="M50 10 A40 40 0 0 1 90 50" strokeLinecap="round" />
              <path d="M50 90 A40 40 0 0 1 10 50" className="text-dt-purple" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold tracking-wide text-white leading-none group-hover:text-dt-orange transition-colors">Darktrace</span>
            <span className="text-[11px] text-dt-text-secondary leading-none mt-0.5">Threat Visualizer</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 flex justify-center items-center px-4 max-w-3xl">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3 bg-[#181920] px-3 py-1 rounded text-[10px] select-none">
        <div className="flex flex-col items-end border-r border-[#2c2d36] pr-3 min-w-[140px]">
          <span className="text-[#94a3b8] leading-none mb-0.5">{dateStr}</span>
          <span className="font-mono text-white tracking-wider font-semibold leading-none">{timeStr}</span>
        </div>
        <div className="flex flex-col items-end min-w-[60px]">
          <span className="text-[#94a3b8] truncate max-w-[80px] leading-none mb-0.5">{timeZoneName || 'Local'}</span>
          <span className="font-mono text-white tracking-wider font-semibold leading-none">{timeZoneStr}</span>
        </div>
        <button className="text-[#94a3b8] hover:text-white transition-colors ml-1">
          <RefreshCw size={12} />
        </button>
      </div>
    </header>
  );
}


