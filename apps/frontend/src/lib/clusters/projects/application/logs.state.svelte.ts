import { source, type Source } from 'sveltekit-sse';
import type { Log } from '../domain/log';
import { arrayToObject } from '$lib/shared/utils/array-to-object';
import { createLogger } from '$lib/shared/logger';
import queryString from 'query-string';
import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';

const logger = createLogger('logs.state', true);

// todo: divide api calls responsibility from state
class LogsState {
	private _logs = $state<Record<Log['id'], Log>>({});
	private syncConnection: Source | null = null;
	private _shouldReconnect = true;
	private _unsubscribe: () => void | null = null;
	private _loadingPage = $state(false);

	get pageIsLoading(): boolean {
		return this._loadingPage;
	}

	get logs(): Log[] {
		return Object.values(this._logs).sort((a, b) => {
			if (a.createdAt < b.createdAt) {
				return -1;
			}
			if (a.createdAt > b.createdAt) {
				return 1;
			}
			if (a.index !== undefined && b.index !== undefined) {
				return a.index - b.index;
			}
			if (
				a.sequenceNumber !== undefined &&
				b.sequenceNumber !== undefined
			) {
				return a.sequenceNumber - b.sequenceNumber;
			}
			return 0;
		});
	}

	set(logs: Log[]): void {
		this._logs = arrayToObject(logs, 'id');
	}

	async sync(project_id: string, tabId: string): Promise<void> {
		this.unsync();
		logger.debug('syncing logs...', project_id, tabId);
		this._logs = {};
		this._shouldReconnect = true;

		await Promise.all([
			this.fetchLogs(project_id),
			this._openLogsStream(project_id, tabId),
		]);
	}

	private _openLogsStream(project_id: string, tabId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.syncConnection = source(
				`/app/api/${project_id}/logs?tab_id=${tabId}`,
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
					logger.info('new SSE message:', message);
					if (!message.length) {
						logger.debug('SSE message empty, skipping...');
						return;
					}
					const log = JSON.parse(message);
					this._logs[log.id] = log;

					logger.debug('added log:', log);
				} catch (e) {
					logger.error('sse message error:', e);
				}
			});
		});
	}

	async loadPreviousPage(project_id: string): Promise<void> {
		const firstLog = this.logs[0];

		if (!firstLog || this._loadingPage) {
			return;
		}

		this._loadingPage = true;
		await this.fetchLogs(project_id, firstLog.id);
		this._loadingPage = false;
	}

	pauseSync(): void {
		this._shouldReconnect = false;
		logger.debug('pausing logs...');
		this._unsubscribe?.();
		this.syncConnection?.close();
		this.syncConnection = null;
	}

	async resumeSync(project_id: string, tabId: string): Promise<void> {
		this.unsync();
		logger.debug('resuming logs...');
		await this.sync(project_id, tabId);
	}

	unsync(): void {
		this._shouldReconnect = false;
		logger.debug('unsyncing logs...');
		this._unsubscribe?.();
		this.syncConnection?.close();
		this.syncConnection = null;
	}

	sendTestLog(project_id: string): Promise<void> {
		return fetch(`/app/api/${project_id}/logs/test`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error('Failed to send test log');
				}

				toast.success('Test log sent successfully.');
			})
			.catch((error) => {
				toast.error('Failed to send test log. Please try again later.');
				logger.error('Failed to send test log:', error);
			});
	}

	private async fetchLogs(
		project_id: string,
		before?: string,
	): Promise<void> {
		const qs = queryString.stringify({ before });
		const response = await fetch(`/app/api/${project_id}/logs?${qs}`);
		const { data }: { data: Log[] } = await response.json();

		if (before) {
			Object.assign(this._logs, arrayToObject<Log>(data, 'id'));
		} else {
			this._logs = arrayToObject<Log>(data, 'id');
		}

		console.log(
			'$state.snapshot(this._logs):',
			$state.snapshot(this._logs),
		);
	}
}

export const logsState = new LogsState();
