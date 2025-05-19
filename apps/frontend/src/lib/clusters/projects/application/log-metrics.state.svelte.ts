import { createLogger } from '$lib/shared/logger';
import { arrayToObject } from '$lib/shared/utils/array-to-object';
import { source, type Source } from 'sveltekit-sse';
import type { LogGranularity } from '../domain/log-granularity';
import type { LogMetric } from '../domain/log-metric';

type GranularLogMetrics = Record<
	LogGranularity,
	Record<LogMetric['date'], LogMetric>
>;

const logger = createLogger('log_metrics.state', true);

// todo: divide api calls responsibility from state
class LogMetricsState {
	private _logMetrics = $state<GranularLogMetrics>({
		day: {},
		hour: {},
		minute: {},
	});
	private syncConnection: Source | null = null;
	private _shouldReconnect = true;
	private _unsubscribe: () => void | null = null;

	get logMetrics(): Record<LogGranularity, LogMetric[]> {
		return {
			day: Object.values(this._logMetrics.day),
			hour: Object.values(this._logMetrics.hour),
			minute: Object.values(this._logMetrics.minute),
		};
	}

	async sync(project_id: string, tabId: string): Promise<void> {
		this.unsync();
		logger.debug('syncing...', project_id, tabId);
		this._logMetrics = {
			day: {},
			hour: {},
			minute: {},
		};
		this._shouldReconnect = true;

		await Promise.all([
			this.fetchLogMetrics(project_id),
			this._openLogMetricsStream(project_id, tabId),
		]);
	}

	private _openLogMetricsStream(
		project_id: string,
		tabId: string,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			this.syncConnection = source(
				`/app/api/${project_id}/log-metrics?tab_id=${tabId}`,
				{
					close: ({ connect }) => {
						if (!this._shouldReconnect) {
							logger.debug(
								'sse manually disconnected, skipping reconnect...',
							);
							return;
						}
						logger.debug('reconnecting...');
						connect();
					},
					error: (error) => {
						logger.error('sse error:', error);
						reject(error);
					},
					open: () => {
						logger.debug('sse opened');
						resolve();
					},
				},
			);
			const value = this.syncConnection.select('message');

			this._unsubscribe = value.subscribe((message) => {
				try {
					if (!message.length) {
						logger.debug('sse message empty, skipping...');
						return;
					}
					const logMetric = JSON.parse(message);
					// Determine which granularity this metric belongs to
					const granularity =
						(logMetric.granularity as LogGranularity) || 'minute';

					if (this._logMetrics[granularity][logMetric.date]) {
						this._logMetrics[granularity][logMetric.date] = {
							...this._logMetrics[granularity][logMetric.date],
							...logMetric,
							values: Object.entries(
								logMetric.values || {},
							).reduce(
								(acc, [key, value]) => {
									acc[key] = acc[key] + value;
									return acc;
								},
								{
									// todo: add rest of the keys
									warning: 0,
									error: 0,
									info: 0,
									...this._logMetrics[granularity][
										logMetric.date
									].values,
								},
							),
						};
					} else {
						this._logMetrics[granularity][logMetric.date] =
							logMetric;
					}
				} catch (e) {
					logger.error('error parsing message:', e);
				}
			});
		});
	}

	pauseSync(): void {
		this._shouldReconnect = false;
		logger.debug('pausing sync...');
		this._unsubscribe?.();
		this.syncConnection?.close();
		this.syncConnection = null;
	}

	async resumeSync(project_id: string, tabId: string): Promise<void> {
		this.unsync();
		logger.debug('resuming sync...');
		await this.sync(project_id, tabId);
	}

	unsync(): void {
		this._shouldReconnect = false;
		logger.debug('unsyncing...');
		this._unsubscribe?.();
		this.syncConnection?.close();
		this.syncConnection = null;
	}

	private async fetchLogMetrics(project_id: string): Promise<void> {
		const response = await fetch(`/app/api/${project_id}/log-metrics`);
		const {
			data,
		}: {
			data: {
				day: LogMetric[];
				hour: LogMetric[];
				minute: LogMetric[];
			};
		} = await response.json();

		// Convert arrays to objects indexed by date for each granularity
		this._logMetrics = {
			day: arrayToObject<LogMetric>(data.day || [], 'date'),
			hour: arrayToObject<LogMetric>(data.hour || [], 'date'),
			minute: arrayToObject<LogMetric>(data.minute || [], 'date'),
		};
	}
}

export const logMetricsState = new LogMetricsState();
