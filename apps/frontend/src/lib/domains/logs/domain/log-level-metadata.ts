import type { LogLevel } from './log-level';

export type LogLevelMetadata = {
  value: LogLevel;
  label: string;
  color: string;
};

export const LOG_LEVELS: LogLevelMetadata[] = [
  { value: 'error', label: 'Error', color: 'bg-[#e7000b]' },
  { value: 'warning', label: 'Warning', color: 'bg-[#fe9a00]' },
  { value: 'info', label: 'Info', color: 'bg-[#155dfc]' },
  { value: 'http', label: 'HTTP', color: 'bg-[#00a6a6]' },
  { value: 'verbose', label: 'Verbose', color: 'bg-[#00a600]' },
  { value: 'debug', label: 'Debug', color: 'bg-[#00a600]' },
  { value: 'silly', label: 'Silly', color: 'bg-[#505050]' },
];

export const LOG_LEVELS_MAP: Record<LogLevel, LogLevelMetadata> =
  Object.fromEntries(LOG_LEVELS.map((l) => [l.value, l])) as Record<
    LogLevel,
    LogLevelMetadata
  >;

export function getLogLevelMetadata(
  level: LogLevel,
): LogLevelMetadata | undefined {
  return LOG_LEVELS_MAP[level];
}
