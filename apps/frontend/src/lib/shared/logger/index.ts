import { isDev } from '../utils/is-dev.util';
import { LogLevel } from './log-level';
import { Logger } from './logger';

export const logger = new Logger(isDev(), 'logdash', LogLevel.DEBUG);

export const createLogger = (name: string, disabled?: boolean): Logger => {
	return new Logger(
		isDev(),
		name,
		disabled ? LogLevel.SILENT : LogLevel.DEBUG,
	);
};
