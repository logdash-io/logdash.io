import { createLogger } from '$lib/shared/logger/index.js';
import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
import { arrayToObject } from '$lib/shared/utils/array-to-object';
import { source, type Source } from 'sveltekit-sse';
import {
	MetricGranularity,
	type Metric,
	type SimplifiedMetric,
} from '../domain/metric';

const logger = createLogger('metrics.state', true);

// todo: divide api calls responsibility from state
class MetricsState {
	private _simplifiedMetrics = $state<
		Record<SimplifiedMetric['metricRegisterEntryId'], SimplifiedMetric>
	>({});
	private _metrics = $state<
		Record<
			Metric['metricRegisterEntryId'],
			Record<MetricGranularity, Record<Metric['date'], Metric>>
		>
	>({});
	private _initialized = $state(false);
	private syncConnection: Source | null = null;
	private _shouldReconnect = true;
	private _metricDetailsLoading = $state(false);
	private _unsubscribe: () => void | null = null;

	get simplifiedMetrics(): SimplifiedMetric[] {
		return Object.values(this._simplifiedMetrics);
	}

	get ready(): boolean {
		return this._initialized;
	}

	get metricDetailsLoading(): boolean {
		return this._metricDetailsLoading;
	}

	getById(id: string): SimplifiedMetric | undefined {
		return this._simplifiedMetrics[id];
	}

	metricsByMetricRegisterId(
		metricId: string,
		granularity: MetricGranularity,
	): Metric[] {
		return (
			Object.values(this._metrics[metricId]?.[granularity] ?? {}) ?? []
		);
	}

	previewMetric(project_id: string, metric_id: string): void {
		this.fetchMetricDetails(project_id, metric_id);
	}

	set(metrics: SimplifiedMetric[]): void {
		this._simplifiedMetrics = arrayToObject(metrics, 'id');
		this._initialized = true;
	}

	async sync(project_id: string, tabId: string): Promise<void> {
		this.unsync();
		this._metrics = {};
		this._shouldReconnect = true;

		logger.debug(`syncing metrics for project ${project_id}...`);

		await Promise.all([
			this.fetchMetrics(project_id),
			this._openMetricsStream(project_id, tabId),
		]);
	}

	private _openMetricsStream(
		project_id: string,
		tabId: string,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			this.syncConnection = source(
				`/app/api/${project_id}/metrics?tab_id=${tabId}`,
				{
					close: ({ connect }) => {
						if (!this._shouldReconnect) {
							logger.debug(
								'sse manually disconnected, skipping reconnect...',
							);
							return;
						}
						// todo refetch logs after the last in memory log id
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
					options: {
						mode: 'cors',
						openWhenHidden: true,
						keepalive: true,
						cache: 'no-cache',
					},
				},
			);
			const value = this.syncConnection.select('message');

			this._unsubscribe = value.subscribe((message) => {
				try {
					if (!message.length) {
						logger.debug('SSE message empty, skipping...');
						return;
					}
					logger.debug('SSE message:', message);
					const metric: Metric = JSON.parse(message);
					const metricId = metric.metricRegisterEntryId;

					this._metrics[metricId] =
						(this._metrics[metricId] as never) || {};

					if (!this._metrics[metricId]) {
						this._metrics[metricId][metric.granularity][
							metric.date
						] = metric;
						logger.debug(
							`added metric ${metric.name} with the value ${metric.value}`,
						);
					} else if (!this._metrics[metricId][metric.granularity]) {
						this._metrics[metricId][metric.granularity] = {
							[metric.date]: metric,
						};
						logger.debug(
							`added metric ${metric.name} with the value ${metric.value}`,
						);
					} else if (
						!this._metrics[metricId][metric.granularity][
							metric.date
						]
					) {
						this._metrics[metricId][metric.granularity][
							metric.date
						] = metric;
						logger.debug(
							`added metric ${metric.name} with the value ${metric.value}`,
						);
					}

					if (metric.granularity !== MetricGranularity.MINUTE) {
						return;
					}

					if (!this._simplifiedMetrics[metricId]) {
						this._simplifiedMetrics[metricId] = {
							metricRegisterEntryId: metric.metricRegisterEntryId,
							id: metricId,
							name: metric.name,
							value: metric.value,
						};
						logger.debug(
							`added all time metric ${metric.name} with the value ${metric.value}`,
						);
					} else {
						this._simplifiedMetrics[metricId].value = metric.value;
						logger.debug(
							`updated all time metric ${metric.name} with the value ${metric.value}`,
						);
					}
				} catch (e) {
					logger.error('sse message error:', e);
				}
			});
		});
	}

	async resumeSync(project_id: string, tabId: string): Promise<void> {
		this.unsync();
		logger.debug('resuming metrics...');
		await this.sync(project_id, tabId);
	}

	async pauseSync(): Promise<void> {
		this._shouldReconnect = false;
		logger.debug('pausing metrics...');
		this._unsubscribe?.();
		this.syncConnection?.close();
		this.syncConnection = null;
	}

	unsync(): void {
		this._shouldReconnect = false;
		logger.debug('unsyncing metrics...');
		this._unsubscribe?.();
		this.syncConnection?.close();
		this.syncConnection = null;
	}

	delete(projectId: string, metricId: string): void {
		const metric = this._simplifiedMetrics[metricId];

		if (this._simplifiedMetrics[metricId]) {
			delete this._simplifiedMetrics[metricId];
		} else {
			logger.warn(`Metric with id ${metricId} does not exist`);
		}

		fetch(
			`/app/api/metrics?project_id=${projectId}&metric_id=${metricId}`,
			{
				method: 'DELETE',
			},
		)
			.then((response) => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(() => {
				toast.success(`Deleted metric ${metric.name}`);
				logger.debug(`Deleted metric with id ${metricId}`);
			})
			.catch((error) => {
				toast.error(
					`Failed to delete metric ${metric.name}. Please try again.`,
				);
				logger.error('Error deleting metric:', error);
				this._simplifiedMetrics[metricId] = metric;
			});
	}

	private fetchMetrics(project_id: string): void {
		const url = `/app/api/${project_id}/metrics`;

		fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(async ({ data }) => {
				this._simplifiedMetrics = arrayToObject(data, 'id');
				this._initialized = true;
			})
			.catch((error) => {
				console.error('Error fetching metrics:', error);
			});
	}

	private async fetchMetricDetails(
		project_id: string,
		metric_id: string,
	): Promise<void> {
		this._metricDetailsLoading = true;
		const url = `/app/api/${project_id}/metrics/details?metric_id=${metric_id}`;

		await fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(({ data }: { data: Metric[] }) => {
				data.forEach((metric) => {
					const metricId = metric.metricRegisterEntryId;
					this._metrics[metricId] =
						(this._metrics[metricId] as never) || {};
					this._metrics[metricId][metric.granularity] =
						this._metrics[metricId][metric.granularity] || {};

					this._metrics[metricId][metric.granularity][metric.date] =
						metric;
				});
			})
			.catch((error) => {
				console.error('Error fetching metrics:', error);
			})
			.finally(() => {
				this._metricDetailsLoading = false;
			});
	}
}

export const metricsState = new MetricsState();
