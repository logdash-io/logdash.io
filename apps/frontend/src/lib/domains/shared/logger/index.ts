import { isDev } from '$lib/domains/shared/utils/is-dev.util';
import { LogLevel } from '$lib/domains/shared/logger/log-level';
import { Logger } from '$lib/domains/shared/logger/logger';

export const logger = new Logger(isDev(), 'logdash', LogLevel.INFO);

export const createLogger = (name: string, disabled?: boolean): Logger => {
  return new Logger(isDev(), name, disabled ? LogLevel.SILENT : LogLevel.DEBUG);
};
