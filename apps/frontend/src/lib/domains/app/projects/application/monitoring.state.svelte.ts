import { source, type Source } from 'sveltekit-sse';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import { createLogger } from '$lib/domains/shared/logger';
import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils.js';
import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils.js';
import { envConfig } from '$lib/domains/shared/utils/env-config.js';
import { EventSource } from 'eventsource';
import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor';
import type {
  HttpPing,
  HttpPingCreatedEvent,
} from '$lib/domains/app/projects/domain/monitoring/http-ping.js';
import { httpClient } from '$lib/domains/shared/http/http-client.js';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';

const logger = createLogger('monitoring.state', true);

// todo: divide api calls responsibility from state
class MonitoringState {
  private _monitors = $state<Record<Monitor['id'], Monitor>>({});
  private _monitorPings = $state<Record<Monitor['id'], HttpPing[]>>({});
  private _previewedMonitors = $state<Record<string, HttpPing[]>>({});
  private syncConnection: EventSource | null = null;
  private previewConnection: Source | null = null;
  private _shouldReconnect = true;
  private _unsubscribe: () => void | null = null;
  private _previewUnsubscribe: () => void | null = null;
  private _loadingPage = $state(false);

  get pageIsLoading(): boolean {
    return this._loadingPage;
  }

  get monitors(): Monitor[] {
    return this._getSortedMonitors();
  }

  hasNotificationChannel(monitorId: string, channelId: string): boolean {
    const monitor = this._monitors[monitorId];
    if (!monitor) {
      return false;
    }
    return (
      monitor.notificationChannelsIds &&
      monitor.notificationChannelsIds.includes(channelId)
    );
  }

  async addNotificationChannel(
    monitorId: string,
    channelId: string,
  ): Promise<void> {
    if (!monitorId || !channelId) {
      return Promise.reject(
        new Error('Monitor ID and Channel ID are required'),
      );
    }

    const monitor = this._monitors[monitorId];

    if (!monitor) {
      return Promise.reject(
        new Error(`Monitor with ID ${monitorId} not found`),
      );
    }

    if (this.hasNotificationChannel(monitorId, channelId)) {
      return Promise.resolve();
    }

    logger.debug(
      `Adding notification channel ${channelId} to monitor ${monitorId}`,
    );

    this._monitors[monitorId].notificationChannelsIds.push(channelId);

    await httpClient.put(`/http_monitors/${monitorId}`, {
      notificationChannelsIds:
        this._monitors[monitorId].notificationChannelsIds,
    });

    toast.success(`Notification channel added to monitor ${monitor.name}`);
  }

  async removeNotificationChannel(
    monitorId: string,
    channelId: string,
  ): Promise<void> {
    if (!monitorId || !channelId) {
      return Promise.reject(
        new Error('Monitor ID and Channel ID are required'),
      );
    }

    const monitor = this._monitors[monitorId];

    if (!monitor) {
      return Promise.reject(
        new Error(`Monitor with ID ${monitorId} not found`),
      );
    }

    if (!this.hasNotificationChannel(monitorId, channelId)) {
      return Promise.resolve();
    }

    logger.debug(
      `Removing notification channel ${channelId} from monitor ${monitorId}`,
    );

    this._monitors[monitorId].notificationChannelsIds = this._monitors[
      monitorId
    ].notificationChannelsIds.filter((id) => id !== channelId);

    await httpClient.put(`/http_monitors/${monitorId}`, {
      notificationChannelsIds:
        this._monitors[monitorId].notificationChannelsIds,
    });

    toast.success(`Notification channel removed from monitor ${monitor.name}`);
  }

  toggleNotificationChannel(
    monitorId: string,
    channelId: string,
  ): Promise<void> {
    if (!monitorId || !channelId) {
      return Promise.reject(
        new Error('Monitor ID and Channel ID are required'),
      );
    }

    if (this.hasNotificationChannel(monitorId, channelId)) {
      return this.removeNotificationChannel(monitorId, channelId);
    } else {
      return this.addNotificationChannel(monitorId, channelId);
    }
  }

  getMonitorByProjectId(projectId: string): Monitor {
    return this.monitors.find((monitor) => monitor.projectId === projectId);
  }

  set(monitors: Monitor[]): void {
    this._monitors = arrayToObject(monitors, 'id');
  }

  async sync(clusterId: string): Promise<void> {
    return this._syncClusterMonitors(clusterId);
  }

  unsync(): void {
    logger.debug('unsyncing monitors...');
    this._stopMonitorsSync();
  }

  pauseSync(): void {
    this._pauseMonitorSync();
  }

  async resumeSync(clusterId: string): Promise<void> {
    return this._resumeMonitorSync(clusterId);
  }

  monitoringPings(monitorId: string): HttpPing[] {
    return this._getSortedPings(this._monitorPings[monitorId]);
  }

  isHealthy(monitorId: string): boolean {
    return this._checkHealthStatus(monitorId);
  }

  getMonitorById(monitorId: string): Monitor | undefined {
    return this._monitors[monitorId];
  }

  getMonitorByUrl(url: string): Monitor | undefined {
    return this.monitors.find((monitor) => monitor.url === url);
  }

  previewUrl(clusterId: string, url: string): void {
    this._startUrlPreview(clusterId, url);
  }

  stopUrlPreview(): void {
    this._stopUrlPreview();
  }

  previewPings(url: string): HttpPing[] {
    return this._getSortedPings(this._previewedMonitors[url]);
  }

  load(clusterId: string): void {
    logger.debug('loading monitors...');
    this._loadingPage = true;
    this._fetchMonitors(clusterId);
  }

  isPreviewHealthy(url: string): boolean {
    const last = <T>(arr: T[]): T | undefined => {
      if (!arr || arr.length === 0) {
        return undefined;
      }
      return arr[arr.length - 1];
    };

    const code = last(this._previewedMonitors[url])?.statusCode;

    if (code === undefined) {
      return false;
    }
    return code >= 200 && code < 400;
  }

  syncMonitorPings(
    clusterId: string,
    projectId: string,
    monitorId: string,
  ): Promise<void> {
    return this._fetchPings(clusterId, projectId, monitorId);
  }

  async updateMonitorName(monitorId: string, newName: string): Promise<void> {
    if (!monitorId || !newName?.trim()) {
      throw new Error('Monitor ID and name are required');
    }

    const monitor = this._monitors[monitorId];
    if (!monitor) {
      throw new Error(`Monitor with ID ${monitorId} not found`);
    }

    await httpClient.put(`/http_monitors/${monitorId}`, {
      name: newName.trim(),
    });

    // Update local state
    this._monitors[monitorId].name = newName.trim();
  }

  async deleteMonitor(monitorId: string): Promise<void> {
    if (!monitorId) {
      throw new Error('Monitor ID is required');
    }

    const monitor = this._monitors[monitorId];
    if (!monitor) {
      throw new Error(`Monitor with ID ${monitorId} not found`);
    }

    await httpClient.delete(`/http_monitors/${monitorId}`);

    // Remove from local state
    delete this._monitors[monitorId];
    delete this._monitorPings[monitorId];
  }

  // Private helper methods
  private _getSortedMonitors(): Monitor[] {
    return Object.values(this._monitors).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  private _getSortedPings(pings: HttpPing[] | undefined): HttpPing[] {
    if (!pings) {
      return [];
    }
    return pings.slice().sort((a, b) => {
      if (a.createdAt < b.createdAt) {
        return -1;
      }
      if (a.createdAt > b.createdAt) {
        return 1;
      }
      return 0;
    });
  }

  private _checkHealthStatus(monitorId: string): boolean {
    const code = this._monitors[monitorId]?.lastStatusCode;

    if (code === undefined) {
      logger.warn(`Monitor ${monitorId} has no last status code`);
      return false;
    }
    return code >= 200 && code < 400;
  }

  private async _syncClusterMonitors(clusterId: string): Promise<void> {
    this.unsync();
    logger.debug('syncing monitors...', clusterId);
    this._monitorPings = {};
    this._shouldReconnect = true;

    await Promise.all([
      this._fetchMonitors(clusterId),
      this._openMonitorStream(clusterId),
    ]);
  }

  private _stopMonitorsSync(): void {
    this._shouldReconnect = false;
    logger.debug('unsyncing monitors...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  private _pauseMonitorSync(): void {
    this._shouldReconnect = false;
    logger.debug('pausing monitors...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  private async _resumeMonitorSync(clusterId: string): Promise<void> {
    this.unsync();
    logger.debug('resuming monitors...');
    await this.sync(clusterId);
  }

  private _startUrlPreview(clusterId: string, url: string): void {
    this._stopUrlPreview();
    this._previewedMonitors[url] = [];

    this.previewConnection = source(
      `/app/api/clusters/${clusterId}/monitors/preview`,
      {
        close: ({ connect }) => {
          logger.debug('preview connection closed, reconnecting...');
          connect();
        },
        error: (error) => {
          logger.error('preview SSE error:', error);
        },
        open: () => {
          logger.debug('preview SSE opened');
        },
        options: {
          mode: 'cors',
          openWhenHidden: true,
          keepalive: true,
          cache: 'no-cache',
          body: JSON.stringify({
            url,
          }),
        },
      },
    );

    const value = this.previewConnection.select('ping-status');

    this._previewUnsubscribe = value.subscribe((message) => {
      try {
        logger.info('new preview SSE message:', message);
        if (!message.length) {
          logger.debug('Preview SSE message empty, skipping...');
          return;
        }

        const parsedMessage: HttpPingCreatedEvent = JSON.parse(message);

        this._previewedMonitors[url].push({
          ...parsedMessage,
        });
      } catch (e) {
        logger.error('preview SSE message error:', e);
      }
    });
  }

  private _stopUrlPreview(): void {
    if (this.previewConnection) {
      logger.debug('stopping URL observation...');
      this._previewUnsubscribe?.();
      this.previewConnection = null;
    }
  }

  private _openMonitorStream(clusterId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._unsubscribe?.();

      this.syncConnection = new EventSource(
        `${envConfig.apiBaseUrl}/clusters/${clusterId}/http_pings/sse`,
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
        logger.debug('monitor SSE opened', event);
        resolve();
      };

      const onError = (event) => {
        logger.error('Monitor SSE connection error:', event);

        this._unsubscribe?.();

        if (this._shouldReconnect) {
          logger.debug('Attempting to reconnect monitors in 3 seconds...');
          setTimeout(() => {
            if (this._shouldReconnect) {
              this._openMonitorStream(clusterId);
            }
          }, 3000);
        }

        reject(new Error('Monitor SSE connection failed'));
      };

      const onMessage = (event) => {
        try {
          logger.info('new monitor SSE message:', event);
          const pingData: HttpPingCreatedEvent = JSON.parse(event.data);

          if (!this._monitorPings[pingData.httpMonitorId]) {
            this._monitorPings[pingData.httpMonitorId] = [];
          }

          this._monitorPings[pingData.httpMonitorId].push({
            ...pingData,
          });

          this._monitors[pingData.httpMonitorId].lastStatusCode =
            pingData.statusCode;

          logger.debug('added ping:', pingData);
        } catch (e) {
          logger.error('monitor SSE message error:', e);
        }
      };

      this.syncConnection.addEventListener('open', onOpen, {
        once: true,
      });
      this.syncConnection.addEventListener('error', onError);
      this.syncConnection.addEventListener('message', onMessage);

      this._unsubscribe = () => {
        if (!this.syncConnection) {
          logger.debug('No active monitor SSE connection to unsubscribe from');
          return;
        }

        this.syncConnection.removeEventListener('open', onOpen);
        this.syncConnection.removeEventListener('error', onError);
        this.syncConnection.removeEventListener('message', onMessage);

        logger.debug('Unsubscribing from monitor SSE connection');

        this.syncConnection?.close();
        this.syncConnection = null;
      };
    });
  }

  private _fetchMonitors(clusterId: string): Promise<void> {
    return fetch(`/app/api/clusters/${clusterId}/monitors`)
      .then((response) => response.json())
      .then(({ data }: { data: Monitor[] }) => {
        this._monitors = arrayToObject<Monitor>(data, 'id');

        for (const monitor of data) {
          if (!this._monitorPings[monitor.id]) {
            this._monitorPings[monitor.id] = [];
          }
        }
      })
      .catch((error) => {
        logger.error('Failed to fetch monitors:', error);
        throw new Error('Failed to fetch monitors');
      });
  }

  private async _fetchPings(
    clusterId: string,
    projectId: string,
    monitorId: string,
  ): Promise<void> {
    const response = await fetch(
      `/app/api/clusters/${clusterId}/monitors/${monitorId}/pings?project_id=${projectId}&limit=10`,
    );
    const { data }: { data: HttpPing[] } = await response.json();

    this._monitorPings[monitorId] = data
      .map((ping) => ({
        ...ping,
        createdAt: new Date(ping.createdAt),
      }))
      .sort((a, b) => {
        if (a.createdAt < b.createdAt) {
          return -1;
        }
        if (a.createdAt > b.createdAt) {
          return 1;
        }
        return 0;
      });
  }
}

export const monitoringState = new MonitoringState();
