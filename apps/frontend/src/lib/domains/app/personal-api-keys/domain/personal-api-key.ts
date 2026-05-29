export type Resource =
  | 'logs'
  | 'metrics'
  | 'monitors'
  | 'projects'
  | 'clusters'
  | 'cluster_invites'
  | 'notification_channels'
  | 'public_dashboards'
  | 'custom_domains'
  | 'ingest_keys'
  | 'audit_log'
  | 'account'
  | 'payments';

export type Action = 'none' | 'read' | 'write';

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

export const RESOURCES: { resource: Resource; label: string }[] = [
  { resource: 'logs', label: 'Logs' },
  { resource: 'metrics', label: 'Metrics' },
  { resource: 'monitors', label: 'Monitors' },
  { resource: 'projects', label: 'Projects' },
  { resource: 'clusters', label: 'Clusters' },
  { resource: 'cluster_invites', label: 'Cluster invites' },
  { resource: 'notification_channels', label: 'Notification channels' },
  { resource: 'public_dashboards', label: 'Public dashboards' },
  { resource: 'custom_domains', label: 'Custom domains' },
  { resource: 'ingest_keys', label: 'Ingest keys' },
  { resource: 'audit_log', label: 'Audit log' },
  { resource: 'account', label: 'Account' },
  { resource: 'payments', label: 'Payments' },
];

export const ACTIONS: { action: Action; label: string }[] = [
  { action: 'none', label: 'No access' },
  { action: 'read', label: 'Read' },
  { action: 'write', label: 'Write' },
];

export type PresetId = 'cli' | 'read-only' | 'all-access' | 'mcp' | 'custom';

export const PRESETS: { id: PresetId; label: string; description: string }[] = [
  {
    id: 'cli',
    label: 'CLI default',
    description: 'Read access to logs, metrics, monitors, projects & clusters',
  },
  {
    id: 'mcp',
    label: 'MCP server',
    description: 'Read access for an MCP server integration',
  },
  {
    id: 'read-only',
    label: 'Read-only',
    description: 'Read access to every resource',
  },
  {
    id: 'all-access',
    label: 'All access',
    description: 'Write access to every resource',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Define each scope manually',
  },
];

const READ_RESOURCES: Resource[] = [
  'logs',
  'metrics',
  'monitors',
  'projects',
  'clusters',
];

function buildScopes(map: (resource: Resource) => Action): ScopeEntry[] {
  return RESOURCES.map(({ resource }) => ({
    resource,
    action: map(resource),
  }));
}

/**
 * Maps a preset to a full set of scope entries (one per resource).
 * `custom` returns everything as `none` as a starting point for editing.
 */
export function presetToScopes(preset: PresetId): ScopeEntry[] {
  switch (preset) {
    case 'cli':
    case 'mcp':
      // CLI default = MCP (for now): logs/metrics/monitors/projects/clusters -> read, rest none
      return buildScopes((resource) =>
        READ_RESOURCES.includes(resource) ? 'read' : 'none',
      );
    case 'read-only':
      return buildScopes(() => 'read');
    case 'all-access':
      return buildScopes(() => 'write');
    case 'custom':
    default:
      return buildScopes(() => 'none');
  }
}
