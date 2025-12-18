type StatusType = 'up' | 'down' | 'degraded' | 'unknown';

type StatusConfig = {
  text: string;
  color: string;
};

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  up: {
    text: 'Operational',
    color: 'text-green-600',
  },
  down: {
    text: 'Down',
    color: 'text-red-600',
  },
  degraded: {
    text: 'Degraded',
    color: 'text-yellow-600',
  },
  unknown: {
    text: 'Unknown',
    color: 'text-gray-400',
  },
};

export function getStatusConfig(status: StatusType): StatusConfig {
  return STATUS_CONFIG[status];
}
