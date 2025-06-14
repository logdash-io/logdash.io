/* eslint-disable @typescript-eslint/no-explicit-any */
import { LogLevel } from './log-level';
import { Namespace } from './namespace';
import { prettyLog } from './pretty-log';

export class Logger {
	private readonly _namespace: Namespace;
	private readonly _logLevel: LogLevel;

	constructor(
		private readonly isDev: boolean,
		namespace: string,
		logLevel: LogLevel,
	) {
		this._namespace = new Namespace(namespace);
		this._logLevel = logLevel;
	}

	error(message: any, ...args: unknown[]): void {
		this._log(LogLevel.ERROR, message, ...args);
	}

	info(message: any, ...args: unknown[]): void {
		this._log(LogLevel.INFO, message, ...args);
	}

	debug(message: any, ...args: unknown[]): void {
		this._log(LogLevel.DEBUG, message, ...args);
	}

	warn(message: any, ...args: unknown[]): void {
		this._log(LogLevel.WARN, message, ...args);
	}

	private _log(level: LogLevel, message: string, ...args: unknown[]): void {
		const loggerEnabled =
			typeof localStorage !== 'undefined'
				? localStorage.getItem('logger_enabled')
				: null;

		if (!this.isDev && !loggerEnabled) {
			return;
		}

		if (this._logLevel > level) {
			return;
		}

		prettyLog(level, this._namespace, message, ...args);
	}
}
