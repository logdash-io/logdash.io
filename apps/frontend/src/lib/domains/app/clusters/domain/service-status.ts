export type ServiceStatus = 'up' | 'down' | 'degraded' | 'unknown';

export const SERVICE_STATUS_DOT: Record<ServiceStatus, string> = {
  up: 'bg-success',
  down: 'bg-error',
  degraded: 'bg-warning',
  unknown: 'bg-neutral-600',
};
