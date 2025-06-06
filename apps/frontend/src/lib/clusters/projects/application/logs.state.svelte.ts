import { createLogger } from '$lib/shared/logger';
import { toast } from '$lib/shared/ui/toaster/toast.state.svelte.js';
import { arrayToObject } from '$lib/shared/utils/array-to-object';
import { getCookieValue } from '$lib/shared/utils/client-cookies.utils.js';
import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/shared/utils/cookies.utils.js';
import { envConfig } from '$lib/shared/utils/env-config.js';
import { EventSource } from 'eventsource';
import queryString from 'query-string';
import type { Log } from '../domain/log';

const logger = createLogger('logs.state', true);

// todo: divide api calls responsibility from state
class LogsState {
	private _logs = $state<Record<Log['id'], Log>>({});
	private syncConnection: EventSource | null = null;
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
			this._unsubscribe?.();

			this.syncConnection = new EventSource(
				`${envConfig.apiBaseUrl}/projects/${project_id}/logs/sse?tabId=${tabId}`,
				{
					fetch: (input, init) =>
						fetch(input, {
							...init,
							headers: {
								...init.headers,
								Authorization: `Bearer ${getCookieValue(ACCESS_TOKEN_COOKIE_NAME, document.cookie)}`,
							},
						}),
				},
			);

			const onOpen = (event) => {
				logger.debug('o', event);
				resolve();
			};
			const onError = (event) => {
				logger.error('SSE connection error:', event);

				this._unsubscribe?.();

				if (this._shouldReconnect) {
					logger.debug('Attempting to reconnect in 3 seconds...');
					setTimeout(() => {
						if (this._shouldReconnect) {
							this._openLogsStream(project_id, tabId);
						}
					}, 3000);
				}

				reject(new Error('SSE connection failed'));
			};
			const onMessage = (event) => {
				try {
					logger.info('new SSE message:', event);
					const log = JSON.parse(event.data) as Log;
					this._logs[log.id] = log;

					logger.debug('added log:', log);
				} catch (e) {
					logger.error('sse message error:', e);
				}
			};

			this.syncConnection.addEventListener('open', onOpen, {
				once: true,
			});
			this.syncConnection.addEventListener('error', onError);
			this.syncConnection.addEventListener('message', onMessage);

			this._unsubscribe = () => {
				if (!this.syncConnection) {
					logger.debug(
						'No active SSE connection to unsubscribe from',
					);
					return;
				}

				this.syncConnection.removeEventListener('open', onOpen);
				this.syncConnection.removeEventListener('error', onError);
				this.syncConnection.removeEventListener('message', onMessage);

				logger.debug('Unsubscribing from SSE connection');

				this.syncConnection?.close();
				this.syncConnection = null;
			};
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
		return fetch(`/app/api/projects/${project_id}/logs/test`, {
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
		const response = await fetch(
			`/app/api/projects/${project_id}/logs?${qs}`,
		);
		const { data }: { data: Log[] } = await response.json();

		if (before) {
			Object.assign(this._logs, arrayToObject<Log>(data, 'id'));
		} else {
			this._logs = arrayToObject<Log>(data, 'id');
		}
	}
}

export const logsState = new LogsState();
