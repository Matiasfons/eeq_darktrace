import { AntigenaAction, Filters, SortConfig, ActionStatus } from './types';
import { supabase } from './supabase';

export async function loadActions(): Promise<AntigenaAction[]> {
  // Fetch all actions from Supabase
  // Supabase returns max 1000 by default, so we paginate
  const allRows: AntigenaAction[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('antigena_actions')
      .select('*')
      .order('start', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Supabase fetch error:', error);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...(data as AntigenaAction[]));
      from += pageSize;
      if (data.length < pageSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

export async function loadActionsByIp(ip: string): Promise<AntigenaAction[]> {
  const allRows: AntigenaAction[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('antigena_actions')
      .select('*')
      .eq('ip', ip)
      .order('start', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Supabase fetch error:', error);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...(data as AntigenaAction[]));
      from += pageSize;
      if (data.length < pageSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

export async function loadUniqueIPs(): Promise<{ ip: string; count: number }[]> {
  const map = new Map<string, number>();
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('antigena_actions')
      .select('ip')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Supabase IP fetch error:', error);
      break;
    }

    if (data && data.length > 0) {
      for (const row of data) {
        if (row.ip) map.set(row.ip, (map.get(row.ip) || 0) + 1);
      }
      from += pageSize;
      if (data.length < pageSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  return Array.from(map.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count);
}

export function getActionStatus(action: AntigenaAction): ActionStatus {
  const now = Date.now();
  if (action.cleared) return 'cleared';
  if (action.active && action.start > now) return 'pending';
  if (action.active) return 'active';
  return 'expired';
}

export function formatEpoch(epoch: number): string {
  if (!epoch) return '—';
  const d = new Date(epoch);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  };
  return d.toLocaleString('en-US', options);
}

export function getUniqueIPs(actions: AntigenaAction[]): string[] {
  const ips = new Set<string>();
  for (const a of actions) {
    if (a.ip) ips.add(a.ip);
  }
  return Array.from(ips).sort();
}

export function filterActions(
  actions: AntigenaAction[],
  filters: Filters,
  ip?: string
): AntigenaAction[] {
  return actions.filter((a) => {
    if (ip && a.ip !== ip) return false;
    if (filters.dateFrom && a.start < filters.dateFrom) return false;
    if (filters.dateTo && a.start > filters.dateTo) return false;
    if (filters.actionType !== 'all' && a.action !== filters.actionType) return false;
    if (!filters.showManual && a.manual) return false;
    if (!filters.showBlocked && a.blocked) return false;

    const status = getActionStatus(a);
    if (filters.statusTab !== status) return false;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = [
        a.ip,
        a.label,
        a.detail,
        a.model,
        a.action,
        a.triggerer?.username || '',
        a.triggerer?.reason || '',
      ].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}

export function sortActions(
  actions: AntigenaAction[],
  sort: SortConfig
): AntigenaAction[] {
  const sorted = [...actions];
  sorted.sort((a, b) => {
    let valA: string | number | boolean;
    let valB: string | number | boolean;

    switch (sort.field) {
      case 'ip':
        valA = a.ip;
        valB = b.ip;
        break;
      case 'label':
        valA = a.label + ' ' + a.detail;
        valB = b.label + ' ' + b.detail;
        break;
      case 'start':
        valA = a.start;
        valB = b.start;
        break;
      case 'expires':
        valA = a.expires;
        valB = b.expires;
        break;
      case 'action':
        valA = a.action;
        valB = b.action;
        break;
      case 'blocked':
        valA = a.blocked ? 1 : 0;
        valB = b.blocked ? 1 : 0;
        break;
      case 'model':
        valA = a.model;
        valB = b.model;
        break;
      case 'active':
        valA = a.active ? 1 : 0;
        valB = b.active ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      const cmp = valA.localeCompare(valB);
      return sort.direction === 'asc' ? cmp : -cmp;
    }
    if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function countByStatus(
  actions: AntigenaAction[],
  filters: Omit<Filters, 'statusTab' | 'search'>,
  ip?: string
): Record<ActionStatus, number> {
  const counts: Record<ActionStatus, number> = {
    pending: 0,
    active: 0,
    cleared: 0,
    expired: 0,
  };

  for (const a of actions) {
    if (ip && a.ip !== ip) continue;
    if (filters.dateFrom && a.start < filters.dateFrom) continue;
    if (filters.dateTo && a.start > filters.dateTo) continue;
    if (filters.actionType !== 'all' && a.action !== filters.actionType) continue;
    if (!filters.showManual && a.manual) continue;
    if (!filters.showBlocked && a.blocked) continue;

    const status = getActionStatus(a);
    counts[status]++;
  }

  return counts;
}
