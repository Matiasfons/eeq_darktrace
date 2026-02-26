'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Server,
  Settings,
  Eye,
  Network,
  Smartphone,
  List,
  TriangleAlert,
  PenLine,
  LineChart,
  PieChart,
  Waypoints,
  MonitorX,
  Box,
  CornerDownLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadUniqueIPs } from '@/lib/data';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [ipIndex, setIpIndex] = useState<{ ip: string; count: number }[]>([]);
  const [loadingIPs, setLoadingIPs] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setLoadingIPs(true);
    loadUniqueIPs().then((data) => {
      setIpIndex(data);
      setLoadingIPs(false);
    });
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return ipIndex.slice(0, 8);
    const q = query.toLowerCase();
    return ipIndex.filter((entry) => entry.ip.includes(q)).slice(0, 12);
  }, [query, ipIndex]);

  // Check if the typed query exactly matches an existing IP
  const queryMatchesExisting = useMemo(() => {
    return ipIndex.some((entry) => entry.ip === query.trim());
  }, [query, ipIndex]);

  const showResults = isFocused || query.length > 0;

  const navigateToIp = (ip: string) => {
    const trimmed = ip.trim();
    if (!trimmed) return;
    router.push(`/device/${encodeURIComponent(trimmed)}`);
    setIsFocused(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      navigateToIp(query);
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative w-full max-w-2xl" ref={containerRef}>
      <div
        className={`relative flex items-center bg-[#181920] rounded-full border transition-all duration-300 ${
          showResults
            ? 'border-[#7b61ff] shadow-[0_0_15px_rgba(123,97,255,0.4)]'
            : 'border-[#2c2d36] hover:border-[#383944]'
        }`}
      >
        <Search
          size={18}
          className={`absolute left-4 ${showResults ? 'text-[#e2e8f0]' : 'text-[#94a3b8]'}`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a device, subnet, IP or host..."
          className="w-full bg-transparent text-sm text-white py-2 pl-11 pr-4 focus:outline-none rounded-full font-mono placeholder:font-sans placeholder:text-[#64748b]"
        />
      </div>

      {showResults && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#1e1e24] border border-[#2c2d36] rounded shadow-2xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {/* Direct search option - always shown when user types something */}
          {query.trim() && !queryMatchesExisting && (
            <button
              onClick={() => navigateToIp(query)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#7b61ff]/10 border-b border-[#2c2d36] transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-[#7b61ff]/20 flex items-center justify-center shrink-0">
                <Search size={13} className="text-[#7b61ff]" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-mono text-[#e2e8f0]">{query.trim()}</span>
                <span className="text-[10px] text-[#64748b] ml-2">Search this IP</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#64748b] bg-[#22232b] px-2 py-1 rounded">
                <CornerDownLeft size={10} />
                Enter
              </div>
            </button>
          )}

          {/* Results from database */}
          {results.length > 0 ? (
            <div className="flex flex-col">
              {results.map((entry) => (
                <SearchResultItem
                  key={entry.ip}
                  icon={<Server size={14} className="text-[#94a3b8]" />}
                  label={entry.ip}
                  count={entry.count}
                  href={`/device/${encodeURIComponent(entry.ip)}`}
                  onClick={() => {
                    setIsFocused(false);
                    setQuery('');
                  }}
                />
              ))}
            </div>
          ) : !query.trim() ? (
            <div className="px-4 py-6 text-center text-xs text-[#64748b]">
              {loadingIPs
                ? 'Loading devices...'
                : ipIndex.length === 0
                ? 'No data in database yet. Type an IP and press Enter to search.'
                : 'Type to search...'}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SearchResultItem({
  icon,
  label,
  count,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  href: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center justify-between px-4 py-2.5 hover:bg-[#2a2a32] border-b border-[#2c2d36] last:border-none transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-mono text-[#e2e8f0] group-hover:text-white">
          {label}
        </span>
        <span className="text-[10px] text-[#64748b] bg-[#181920] px-1.5 py-0.5 rounded">
          {count} actions
        </span>
      </div>

      <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
        <ActionIcon icon={<Settings size={14} />} />
        <ActionIcon icon={<Eye size={14} />} />
        <ActionIcon icon={<Network size={14} />} />
        <ActionIcon icon={<Smartphone size={14} />} />
        <ActionIcon icon={<List size={14} />} />
        <ActionIcon icon={<TriangleAlert size={14} />} />
        <ActionIcon icon={<PenLine size={14} />} />
        <ActionIcon icon={<LineChart size={14} />} />
        <ActionIcon icon={<PieChart size={14} />} />
        <ActionIcon icon={<Waypoints size={14} />} />
        <ActionIcon icon={<MonitorX size={14} />} />
        <ActionIcon icon={<Box size={14} />} className="text-[#7b61ff]" />
      </div>
    </Link>
  );
}

function ActionIcon({
  icon,
  className = 'text-[#94a3b8]',
}: {
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      className={`p-1 hover:bg-[#383944] hover:text-white rounded transition-colors ${className}`}
    >
      {icon}
    </button>
  );
}
