import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config';
import { UserTier } from '$lib/domains/shared/types';

export type Table = {
  headers: string[];
  rows: string[][];
};

export type TableType =
  | 'logsRetention'
  | 'logsRateLimits'
  | 'metricsPerService'
  | 'metricsRetention';

export const tableTitles: Record<TableType, string> = {
  logsRetention: 'Logs retention',
  logsRateLimits: 'Rate limit per hour',
  metricsPerService: 'Metrics per service',
  metricsRetention: 'Metrics retention',
};

const PLAN_TIERS = [UserTier.FREE, UserTier.BUILDER, UserTier.PRO] as const;

const PLAN_NAMES: Record<(typeof PLAN_TIERS)[number], string> = {
  [UserTier.FREE]: 'Hobby',
  [UserTier.BUILDER]: 'Builder',
  [UserTier.PRO]: 'Pro',
};

function formatRetentionHours(hours: number | undefined): string {
  if (!hours) return '-';
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

function formatCompactNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '-';
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const thousands = num / 1_000;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(0)}k`;
  }
  return num.toLocaleString('en-US');
}

function formatRateLimit(num: number | undefined): string {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('en-US');
}

function formatLogsRetention(
  retentionHours: number | undefined,
  rateLimitPerHour: number | undefined,
): string {
  if (!retentionHours || !rateLimitPerHour) return '-';
  const logsCapacity = retentionHours * rateLimitPerHour;
  return `${formatRetentionHours(retentionHours)} (${formatCompactNumber(logsCapacity)} logs per service)`;
}

function getProjectPlanConfig(config: ExposedConfig, tier: UserTier) {
  return config?.projectPlanConfigs?.[tier];
}

/** Plan limits come from the backend config, so the docs never drift from billing. */
export function buildTablesFromConfig(
  config: ExposedConfig,
): Record<TableType, Table> {
  const availableTiers = PLAN_TIERS.filter(
    (tier) => getProjectPlanConfig(config, tier) !== undefined,
  );
  const headers = availableTiers.map((tier) => PLAN_NAMES[tier]);

  return {
    logsRetention: {
      headers,
      rows: [
        availableTiers.map((tier) => {
          const planConfig = getProjectPlanConfig(config, tier);
          return formatLogsRetention(
            planConfig?.logs?.retentionHours,
            planConfig?.logs?.rateLimitPerHour,
          );
        }),
      ],
    },
    logsRateLimits: {
      headers,
      rows: [
        availableTiers.map((tier) => {
          const planConfig = getProjectPlanConfig(config, tier);
          return formatRateLimit(planConfig?.logs?.rateLimitPerHour);
        }),
      ],
    },
    metricsPerService: {
      headers,
      rows: [
        availableTiers.map((tier) => {
          const planConfig = getProjectPlanConfig(config, tier);
          return String(planConfig?.metrics?.maxMetricsRegisterEntries ?? '-');
        }),
      ],
    },
    metricsRetention: {
      headers,
      rows: [
        availableTiers.map((tier) => {
          const planConfig = getProjectPlanConfig(config, tier);
          const granularities = planConfig?.metrics?.keepGranularitiesForHours;
          const maxRetention = Math.max(
            granularities?.minute ?? 0,
            granularities?.hour ?? 0,
            granularities?.day ?? 0,
          );
          return formatRetentionHours(maxRetention || undefined);
        }),
      ],
    },
  };
}
