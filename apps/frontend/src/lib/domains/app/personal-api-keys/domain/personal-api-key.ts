export type Resource =
  | 'logs'
  | 'metrics'
  | 'monitors'
  | 'projects'
  | 'clusters'
  | 'account';

export type Action = 'none' | 'read' | 'write' | 'delete';

export type ScopeEntry = {
  resource: Resource;
  action: Action;
};

export type AccessRestriction =
  | { kind: 'all' }
  | { kind: 'clusters'; ids: string[] }
  | { kind: 'projects'; ids: string[] };

export type PersonalApiKey = {
  id: string;
  prefix: string;
  label: string;
  scopes: ScopeEntry[];
  access: AccessRestriction;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
};

export type CreatedPersonalApiKey = PersonalApiKey & {
  value: string;
};

export const RESOURCES: {
  resource: Resource;
  label: string;
  actions: Action[];
}[] = [
  { resource: 'logs', label: 'Logs', actions: ['none', 'read'] },
  { resource: 'metrics', label: 'Metrics', actions: ['none', 'read'] },
  {
    resource: 'monitors',
    label: 'Monitors',
    actions: ['none', 'read', 'write', 'delete'],
  },
  { resource: 'projects', label: 'Services', actions: ['none', 'read'] },
  { resource: 'clusters', label: 'Domains', actions: ['none', 'read'] },
  { resource: 'account', label: 'Account', actions: ['none', 'read'] },
];

export const ACTION_LABELS: Record<Action, string> = {
  none: 'No access',
  read: 'Read',
  write: 'Write',
  delete: 'Delete',
};

export const DEFAULT_SCOPES: ScopeEntry[] = [
  { resource: 'logs', action: 'read' },
  { resource: 'metrics', action: 'read' },
  { resource: 'monitors', action: 'read' },
  { resource: 'projects', action: 'read' },
  { resource: 'clusters', action: 'read' },
];

export const EXPIRY_OPTIONS: { label: string; days: number | null }[] = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
  { label: 'No expiration', days: null },
];
