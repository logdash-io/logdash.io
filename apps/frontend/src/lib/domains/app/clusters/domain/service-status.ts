export type ServiceStatus = 'up' | 'down' | 'degraded' | 'unknown';

export const SERVICE_STATUS_DOT: Record<ServiceStatus, string> = {
  up: 'bg-success',
  down: 'bg-error',
  degraded: 'bg-warning',
  unknown: 'bg-idle',
};

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  up: 'Up',
  down: 'Down',
  degraded: 'Degraded',
  unknown: 'No data',
};

export const SERVICE_STATUS_TEXT: Record<ServiceStatus, string> = {
  up: 'text-fg-muted',
  down: 'text-error',
  degraded: 'text-warning',
  unknown: 'text-fg-muted',
};
