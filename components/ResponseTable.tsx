'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Search, RefreshCw, Layers, ChevronUp, ChevronDown, ArrowUpDown, X, Clock, User, Zap, ShieldCheck, ShieldOff, RotateCcw, Play, Square } from 'lucide-react';
import {
  AntigenaAction,
  Filters,
  SortConfig,
  SortField,
  ActionStatus,
  ACTION_LABEL_MAP,
} from '@/lib/types';
import {
  filterActions,
  sortActions,
  formatEpoch,
  getActionStatus,
  countByStatus,
} from '@/lib/data';

interface ResponseTableProps {
  ip: string;
  allActions: AntigenaAction[];
  filters: Filters;
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  setStatusTab: (tab: ActionStatus) => void;
  loading: boolean;
  onRefresh: () => void;
}

const PAGE_SIZE = 50;

// Generate mock history timeline for an action
interface HistoryEntry {
  timestamp: number;
  event: string;
  detail: string;
  icon: 'create' | 'activate' | 'extend' | 'clear' | 'expire' | 'reactivate' | 'block';
  user?: string;
}

function generateMockHistory(action: AntigenaAction): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  const startTime = action.start;
  const expiresTime = action.expires;

  // 1. Action created
  const createdTime = startTime - Math.floor(Math.random() * 5000) - 500;
  entries.push({
    timestamp: createdTime,
    event: 'Action Created',
    detail: action.manual
      ? `Manually triggered by ${action.triggerer?.username || 'operator'}${action.triggerer?.reason ? ` — "${action.triggerer.reason}"` : ''}`
      : `Automatically triggered by Darktrace RESPOND — Model breach score: ${action.score || 'N/A'}`,
    icon: 'create',
    user: action.manual ? action.triggerer?.username : undefined,
  });

  // 2. Action activated (if not pending)
  if (action.active || !action.active) {
    entries.push({
      timestamp: startTime,
      event: 'Action Activated',
      detail: `${action.label} ${action.detail}`,
      icon: 'activate',
    });
  }

  // 3. Blocked connections (if blocked)
  if (action.blocked) {
    const blockTime = startTime + Math.floor(Math.random() * 10000) + 1000;
    entries.push({
      timestamp: blockTime,
      event: 'Connections Blocked',
      detail: `Matching connections were successfully blocked for ${action.ip}`,
      icon: 'block',
    });
  }

  // 4. Possibly extended (random chance for active/expired)
  const duration = expiresTime - startTime;
  if (duration > 7200000 && Math.random() > 0.6) {
    const extendTime = startTime + Math.floor(duration * 0.4);
    entries.push({
      timestamp: extendTime,
      event: 'Action Extended',
      detail: `Duration extended — New expiry: ${formatEpoch(expiresTime)}`,
      icon: 'extend',
      user: 'operator@darktrace',
    });
  }

  // 5. Cleared or expired
  if (action.cleared) {
    const clearTime = expiresTime - Math.floor(Math.random() * (duration * 0.3));
    entries.push({
      timestamp: clearTime,
      event: 'Action Cleared',
      detail: 'Manually cleared by operator. Suppresses matching alert conditions for remaining duration.',
      icon: 'clear',
      user: 'operator@darktrace',
    });
  } else if (!action.active) {
    entries.push({
      timestamp: expiresTime,
      event: 'Action Expired',
      detail: 'Action reached expiration time and is no longer enforced.',
      icon: 'expire',
    });
  }

  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

export default function ResponseTable({
  ip,
  allActions,
  filters,
  updateFilter,
  setStatusTab,
  loading,
  onRefresh,
}: ResponseTableProps) {
  const [sort, setSort] = useState<SortConfig>({ field: 'start', direction: 'desc' });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeMainTab, setActiveMainTab] = useState<'network' | 'platform' | 'settings'>('network');
  const [historyAction, setHistoryAction] = useState<AntigenaAction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const statusCounts = useMemo(() => {
    return countByStatus(allActions, filters, ip);
  }, [allActions, filters, ip]);

  const filteredActions = useMemo(() => {
    const filtered = filterActions(allActions, filters, ip);
    return sortActions(filtered, sort);
  }, [allActions, filters, ip, sort]);

  const visibleActions = useMemo(() => {
    return filteredActions.slice(0, visibleCount);
  }, [filteredActions, visibleCount]);

  const hasMore = visibleCount < filteredActions.length;

  // Reset visible count when filters/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [filters, sort]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { root: scrollContainerRef.current, rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  const handleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    );
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1200);
  }, [onRefresh]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ArrowUpDown size={10} className="ml-1 opacity-30" />;
    return sort.direction === 'asc' ? (
      <ChevronUp size={10} className="ml-1 text-[#7b61ff]" />
    ) : (
      <ChevronDown size={10} className="ml-1 text-[#7b61ff]" />
    );
  };

  const statusTabs: { key: ActionStatus; label: string }[] = [
    { key: 'pending', label: 'Pending Actions' },
    { key: 'active', label: 'Active Actions' },
    { key: 'cleared', label: 'Cleared Actions' },
    { key: 'expired', label: 'Expired Actions' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0b0c10] overflow-hidden min-w-0 relative">
      {/* Header */}
      <div className="h-12 border-b border-dt-border flex items-center justify-between px-4 shrink-0 bg-[#0b0c10]">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-[#94a3b8]" />
          <h1 className="text-sm font-semibold text-[#e2e8f0]">
            Response Actions for {ip}
          </h1>
          {!loading && (
            <span className="text-[10px] text-[#64748b] ml-2">
              ({filteredActions.length} results)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-1 bg-[#33333d] rounded-full" />
          <div className="w-3 h-3 border border-[#33333d] rounded-sm" />
          <div className="w-3 h-3 border border-[#33333d] rounded-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 border border-[#33333d]" />
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-6 px-6 border-b border-[#2c2d36] bg-[#0b0c10] shrink-0">
        <Tab label="Network Actions" active={activeMainTab === 'network'} onClick={() => setActiveMainTab('network')} />
        <Tab label="Platform Actions" active={activeMainTab === 'platform'} onClick={() => setActiveMainTab('platform')} />
        <Tab label="Settings" active={activeMainTab === 'settings'} onClick={() => setActiveMainTab('settings')} />
      </div>

      {activeMainTab === 'network' ? (
        <>
          {/* Toolbar */}
          <div className="px-6 py-4 flex items-center justify-between shrink-0">
            <div className="relative w-96">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Filter by device, model or IP"
                className="w-full bg-[#181920] border border-[#2c2d36] rounded-full pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-[#7b61ff] transition-colors"
              />
            </div>
            <button className="bg-[#7b61ff] hover:bg-[#6b51ef] text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(123,97,255,0.3)] shrink-0">
              <Layers size={14} />
              Launch Response Action
            </button>
          </div>

          {/* Sub Tabs */}
          <div className="px-6 flex items-center gap-6 border-b border-[#2c2d36] shrink-0 overflow-x-auto">
            {statusTabs.map((tab) => (
              <SubTab
                key={tab.key}
                label={tab.label}
                count={statusCounts[tab.key]}
                active={filters.statusTab === tab.key}
                onClick={() => setStatusTab(tab.key)}
              />
            ))}
            <div className="flex-1 min-w-[20px]" />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-[#94a3b8] hover:text-white transition-colors pb-2 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Refresh banner */}
          {refreshing && (
            <div className="px-6 py-1.5 bg-[#7b61ff]/10 border-b border-[#7b61ff]/20 flex items-center gap-2 shrink-0">
              <RefreshCw size={12} className="text-[#7b61ff] animate-spin" />
              <span className="text-[10px] text-[#7b61ff]">Refreshing actions data...</span>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={24} className="text-[#7b61ff] animate-spin" />
                <span className="text-xs text-[#94a3b8]">Loading actions...</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar" ref={scrollContainerRef}>
              <div className="min-w-max">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="sticky top-0 bg-[#0b0c10] z-10 shadow-[0_1px_0_#2c2d36] select-none">
                    <tr>
                      <Th label="Device" field="ip" sort={sort} onSort={handleSort} SortIcon={SortIcon} />
                      <Th label="IP" field="ip" sort={sort} onSort={handleSort} SortIcon={SortIcon} />
                      <Th label="Action" field="label" sort={sort} onSort={handleSort} SortIcon={SortIcon} className="w-80" />
                      <th className="px-6 py-3 font-semibold text-[#94a3b8] w-32 text-center">History</th>
                      <Th label="Start" field="start" sort={sort} onSort={handleSort} SortIcon={SortIcon} className="w-52" />
                      <Th label="Expires" field="expires" sort={sort} onSort={handleSort} SortIcon={SortIcon} className="w-52" />
                      <Th label="Type" field="action" sort={sort} onSort={handleSort} SortIcon={SortIcon} />
                      <Th label="Blocked" field="blocked" sort={sort} onSort={handleSort} SortIcon={SortIcon} />
                      <Th label="Model" field="model" sort={sort} onSort={handleSort} SortIcon={SortIcon} className="w-72" />
                      <th className="px-6 py-3 font-semibold text-[#94a3b8] min-w-[250px]">
                        Current Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2c2d36]">
                    {visibleActions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-16 text-center text-[#64748b]">
                          No actions found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      visibleActions.map((action) => (
                        <TableRow
                          key={action.codeid}
                          action={action}
                          onViewHistory={() => setHistoryAction(action)}
                        />
                      ))
                    )}
                  </tbody>
                </table>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-1" />

                {hasMore && (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <RefreshCw size={12} className="text-[#7b61ff] animate-spin" />
                    <span className="text-[10px] text-[#64748b]">Loading more...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status bar */}
          {!loading && filteredActions.length > 0 && (
            <div className="px-6 py-1.5 border-t border-[#2c2d36] shrink-0 bg-[#0b0c10]">
              <span className="text-[10px] text-[#64748b]">
                Showing {visibleActions.length} of {filteredActions.length}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-[#64748b]">
            {activeMainTab === 'platform' ? 'Platform Actions' : 'Settings'} — Coming soon
          </span>
        </div>
      )}

      {/* History Slide-out Panel */}
      {historyAction && (
        <HistoryPanel action={historyAction} onClose={() => setHistoryAction(null)} />
      )}
    </div>
  );
}

/* ─── History Panel ─── */

function HistoryPanel({ action, onClose }: { action: AntigenaAction; onClose: () => void }) {
  const history = useMemo(() => generateMockHistory(action), [action]);
  const status = getActionStatus(action);

  const iconMap: Record<HistoryEntry['icon'], React.ReactNode> = {
    create: <Zap size={14} className="text-[#7b61ff]" />,
    activate: <Play size={14} className="text-green-400" />,
    extend: <Clock size={14} className="text-blue-400" />,
    clear: <ShieldOff size={14} className="text-amber-400" />,
    expire: <Square size={14} className="text-[#64748b]" />,
    reactivate: <RotateCcw size={14} className="text-cyan-400" />,
    block: <ShieldCheck size={14} className="text-red-400" />,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[480px] bg-[#13141a] border-l border-[#2c2d36] z-50 flex flex-col shadow-2xl animate-slide-in">
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-[#2c2d36] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-[#7b61ff]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Action History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#22232b] text-[#94a3b8] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Summary */}
        <div className="px-5 py-4 border-b border-[#2c2d36] bg-[#181920]/50 shrink-0">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[10px] font-mono text-[#64748b]">ID: {action.codeid}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                status === 'active'
                  ? 'bg-green-500/10 text-green-400'
                  : status === 'expired'
                  ? 'bg-[#2a2a32] text-[#64748b]'
                  : status === 'cleared'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-blue-500/10 text-blue-400'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-[#e2e8f0] leading-relaxed mb-2">
            {action.label} {action.detail}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            <div>
              <span className="text-[#64748b]">Device: </span>
              <span className="text-[#e2e8f0] font-mono">{action.ip}</span>
            </div>
            <div>
              <span className="text-[#64748b]">Type: </span>
              <span className="text-[#e2e8f0]">{ACTION_LABEL_MAP[action.label] || action.action}</span>
            </div>
            <div>
              <span className="text-[#64748b]">Blocked: </span>
              <span className={action.blocked ? 'text-red-400' : 'text-[#e2e8f0]'}>
                {action.blocked ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-[#64748b]">Manual: </span>
              <span className="text-[#e2e8f0]">{action.manual ? 'Yes' : 'No'}</span>
            </div>
            {action.model && (
              <div className="col-span-2">
                <span className="text-[#64748b]">Model: </span>
                <span className="text-[#94a3b8]">{action.model}</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h3 className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-4">
            State Transitions
          </h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#2c2d36]" />

            <div className="flex flex-col gap-0">
              {history.map((entry, i) => (
                <div key={i} className="relative flex items-start gap-4 pb-6 last:pb-0">
                  {/* Dot */}
                  <div className="relative z-10 w-[31px] h-[31px] rounded-full bg-[#1e1f26] border border-[#2c2d36] flex items-center justify-center shrink-0">
                    {iconMap[entry.icon]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#e2e8f0]">{entry.event}</span>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] leading-relaxed mb-1">{entry.detail}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#64748b] font-mono">
                        {formatEpoch(entry.timestamp)}
                      </span>
                      {entry.user && (
                        <span className="text-[10px] text-[#64748b] flex items-center gap-1">
                          <User size={9} />
                          {entry.user}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="px-5 py-3 border-t border-[#2c2d36] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-[#64748b]">
            {history.length} event{history.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full text-[10px] border border-[#2c2d36] text-[#94a3b8] hover:bg-[#22232b] hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Sub-components ─── */

function Tab({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 text-[13px] font-semibold transition-colors border-b-2 whitespace-nowrap ${
        active
          ? 'border-[#7b61ff] text-[#7b61ff]'
          : 'border-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
      }`}
    >
      {label}
    </button>
  );
}

function SubTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 text-[11px] font-semibold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
        active
          ? 'border-[#7b61ff] text-[#e2e8f0]'
          : 'border-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
      }`}
    >
      {label}
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] ${
          active ? 'bg-[#2a2a32] text-white' : 'bg-[#181920] text-[#64748b]'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function Th({
  label,
  field,
  sort,
  onSort,
  SortIcon,
  className = '',
}: {
  label: string;
  field: SortField;
  sort: SortConfig;
  onSort: (f: SortField) => void;
  SortIcon: React.FC<{ field: SortField }>;
  className?: string;
}) {
  return (
    <th
      className={`px-6 py-3 font-semibold text-[#94a3b8] cursor-pointer hover:text-white select-none transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon field={field} />
      </span>
    </th>
  );
}

function TableRow({ action, onViewHistory }: { action: AntigenaAction; onViewHistory: () => void }) {
  const status = getActionStatus(action);
  const typeName = ACTION_LABEL_MAP[action.label] || action.action;
  const actionText = `${action.label} ${action.detail}`;
  const isManual = action.manual;
  const statusText = action.active
    ? 'Active'
    : action.cleared
    ? 'Cleared by operator'
    : 'Expired';

  return (
    <tr className="hover:bg-[#181920] transition-colors group">
      <td className="px-6 py-3.5 text-[#e2e8f0]">{action.ip || '—'}</td>
      <td className="px-6 py-3.5 text-[#e2e8f0] font-mono text-[11px]">{action.ip || '—'}</td>
      <td
        className="px-6 py-3.5 text-[#e2e8f0] max-w-xs whitespace-normal leading-relaxed"
        title={actionText}
      >
        <span className="line-clamp-2">{actionText}</span>
      </td>
      <td className="px-6 py-3.5 text-center">
        <button
          onClick={onViewHistory}
          className="border border-[#33333d] rounded-full px-4 py-1.5 text-[#e2e8f0] hover:bg-[#22232b] hover:border-[#7b61ff]/50 transition-colors font-medium whitespace-nowrap text-[10px]"
        >
          View History
        </button>
      </td>
      <td className="px-6 py-3.5 text-[#e2e8f0] tracking-wide whitespace-nowrap text-[11px]">
        <span className="text-[#94a3b8] mr-1">&#9655;</span>
        {formatEpoch(action.start)}
      </td>
      <td className="px-6 py-3.5 text-[#e2e8f0] tracking-wide whitespace-nowrap text-[11px]">
        <span className="text-[#94a3b8] mr-1">&#9723;</span>
        {formatEpoch(action.expires)}
      </td>
      <td className="px-6 py-3.5 text-[#e2e8f0]">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
            action.action === 'quarantine' || action.action === 'quarantineOutgoing'
              ? 'bg-red-500/10 text-red-400'
              : action.action === 'connection'
              ? 'bg-blue-500/10 text-blue-400'
              : 'bg-amber-500/10 text-amber-400'
          }`}
        >
          {typeName}
        </span>
      </td>
      <td className="px-6 py-3.5">
        {action.blocked ? (
          <span className="text-red-400 text-[10px] font-semibold">Yes</span>
        ) : (
          <span className="text-[#64748b] text-[10px]">No</span>
        )}
      </td>
      <td
        className="px-6 py-3.5 text-[#94a3b8] max-w-xs whitespace-normal leading-relaxed text-[11px]"
        title={action.model}
      >
        <span className="line-clamp-2">{action.model || (isManual ? `Manual — ${action.triggerer?.reason || 'N/A'}` : '—')}</span>
      </td>
      <td className="px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] ${
              status === 'active'
                ? 'text-green-400'
                : status === 'expired'
                ? 'text-[#64748b]'
                : status === 'cleared'
                ? 'text-amber-400'
                : 'text-blue-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'active'
                  ? 'bg-green-400'
                  : status === 'expired'
                  ? 'bg-[#64748b]'
                  : status === 'cleared'
                  ? 'bg-amber-400'
                  : 'bg-blue-400'
              }`}
            />
            {statusText}
          </span>
        </div>
        {status === 'expired' && (
          <button className="border border-[#33333d] rounded-full px-4 py-1.5 text-[#e2e8f0] hover:bg-[#22232b] transition-colors font-medium opacity-0 group-hover:opacity-100 shrink-0 whitespace-nowrap text-[10px]">
            Reactivate
          </button>
        )}
      </td>
    </tr>
  );
}
