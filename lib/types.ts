export interface AntigenaAction {
  codeid: number;
  did: number;
  ip: string;
  ips: string[];
  action: ActionType;
  manual: boolean;
  triggerer: Triggerer | null;
  label: string;
  detail: string;
  score: number;
  pbid: number;
  model: string;
  modeluuid: string;
  start: number;    // epoch ms
  expires: number;  // epoch ms
  blocked: boolean;
  active: boolean;
  cleared: boolean;
}

export type ActionType = 'connection' | 'gpol' | 'quarantineOutgoing' | 'pol' | 'quarantine';

export interface Triggerer {
  username: string;
  reason: string;
}

export type ActionStatus = 'pending' | 'active' | 'cleared' | 'expired';

export interface Filters {
  dateFrom: number | null;
  dateTo: number | null;
  actionType: ActionType | 'all';
  showManual: boolean;
  showBlocked: boolean;
  search: string;
  statusTab: ActionStatus;
}

export type SortField = 'ip' | 'label' | 'start' | 'expires' | 'action' | 'blocked' | 'model' | 'active';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  connection: 'Connection',
  gpol: 'Group Pattern',
  quarantineOutgoing: 'Quarantine Outgoing',
  pol: 'Pattern of Life',
  quarantine: 'Quarantine',
};

export const ACTION_LABEL_MAP: Record<string, string> = {
  'Block connections': 'Network',
  'Enforce group pattern of life': 'Group Policy',
  'Block all outgoing traffic': 'Quarantine Out',
  'Enforce pattern of life': 'Policy',
  'Quarantine device': 'Quarantine',
};
