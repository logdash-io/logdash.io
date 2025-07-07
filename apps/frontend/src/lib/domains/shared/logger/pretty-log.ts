import { LogLevel } from '$lib/domains/shared/logger/log-level';
import { Namespace } from '$lib/domains/shared/logger/namespace';

export const prettyLog = (
  level: LogLevel,
  namespace: Namespace,
  message: string,
  ...args: unknown[]
) => {
  const color = logColors[level];
  const logLevel = logLevelNames[level];

  const headline = [
    `%c${namespace}%c %c${logLevel}`,
    styleBadge('white', namespace.color),
    '',
    styleBadge(color, 'white'),
    message,
  ];

  if (args.length) {
    console.log(...headline, ...args);
  } else {
    console.log(...headline);
  }
};

const styleBadge = (bgColor: string, textColor: string) => `
    background-color: ${bgColor};
    color: ${textColor};
    font-size: 10px;
    padding: 1.2px 4px;
    margin-right: 0px;
    border-radius: 4px;
    font-weight: normal;
`;

const logColors: Record<LogLevel, string> = {
  [LogLevel.SILENT]: 'transparent',
  [LogLevel.ERROR]: '#dc3545',
  [LogLevel.INFO]: '#0275d8',
  [LogLevel.DEBUG]: '#6c757d',
  [LogLevel.WARN]: '#f59e0b',
};

const logLevelNames: Record<LogLevel, string> = {
  [LogLevel.SILENT]: '',
  [LogLevel.ERROR]: 'error',
  [LogLevel.INFO]: 'info',
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.WARN]: 'warn',
};
