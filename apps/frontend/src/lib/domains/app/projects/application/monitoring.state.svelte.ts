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
import {
  monitoringService,
  type CreateMonitorDto,
  type UpdateMonitorDto,
} from '$lib/domains/app/projects/infrastructure/monitoring.service';
import type {
  PingBucket,
  PingBucketPeriod,
} from '$lib/domains/app/projects/domain/monitoring/ping-bucket';

const logger = createLogger('monitoring.state', false);

const MONITORING_TIME_RANGE_KEY = 'monitoring_time_range';

// todo: divide api calls responsibility from state
class MonitoringState {
  private _monitors = $state<Record<Monitor['id'], Monitor>>({});
  private _monitorPings = $state<Record<Monitor['id'], HttpPing[]>>({});
  private _unclaimedMonitors = $state<Record<Monitor['id'], Monitor>>({});
  private _pingBuckets = $state<Record<Monitor['id'], (PingBucket | null)[]>>(
    {},
  );
  private _timeRange = $state<PingBucketPeriod>('90d');
  private syncConnection: EventSource | null = null;
  private _shouldReconnect = true;
  private _unsubscribe: () => void | null = null;
  private _loadingPage = $state(false);

  get pageIsLoading(): boolean {
    return this._loadingPage;
  }

  get monitors(): Monitor[] {
    return this._getSortedMonitors();
  }

  get timeRange(): PingBucketPeriod {
    return this._timeRange;
  }

  setTimeRange(period: PingBucketPeriod): void {
    this._timeRange = period;
    this._saveTimeRangePreference(period);
    this.reloadAllPingBuckets();
  }

  private _loadTimeRangePreference(): PingBucketPeriod {
    if (typeof localStorage === 'undefined') {
      return '90d';
    }

    const saved = localStorage.getItem(MONITORING_TIME_RANGE_KEY);

    if (saved && (saved === '90h' || saved === '90d')) {
      return saved as PingBucketPeriod;
    }
    return '90d';
  }

  private _saveTimeRangePreference(period: PingBucketPeriod): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(MONITORING_TIME_RANGE_KEY, period);
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
    await Promise.all([
      this._syncClusterMonitors(clusterId),
      this.reloadAllPingBuckets(),
    ]);
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

  load(clusterId: string): void {
    logger.debug('loading monitors...');
    this._loadingPage = true;
    this._fetchMonitors(clusterId);
  }

  loadMonitorPings(
    projectId: string,
    monitorId: string,
    limit: number = 60,
  ): Promise<void> {
    return this._fetchPings(projectId, monitorId, limit);
  }

  getPingBuckets(monitorId: string): (PingBucket | null)[] {
    return this._pingBuckets[monitorId] || [];
  }

  getMockedPingBuckets(): (PingBucket | null)[] {
    const buckets: (PingBucket | null)[] = [];
    for (let i = 0; i < 200; i++) {
      buckets.push(null);
    }
    return buckets;
  }

  async loadPingBuckets(monitorId: string, limit: number = 60): Promise<void> {
    this._timeRange = this._loadTimeRangePreference();
    try {
      const response = await monitoringService.getPingBuckets(
        monitorId,
        this._timeRange,
      );
      // Backend returns newest-first, chart expects oldest-first (left = old, right = now)
      this._pingBuckets[monitorId] = response.buckets.reverse();
    } catch (error) {
      logger.error('Failed to load ping buckets:', error);
      throw new Error('Failed to load ping buckets');
    }
  }

  async reloadAllPingBuckets(): Promise<void> {
    const monitorIds = Object.keys(this._monitors);
    const promises = monitorIds.map((monitorId) =>
      this.loadPingBuckets(monitorId, 60),
    );

    await Promise.allSettled(promises);
  }

  calculateUptime(monitorId: string): number {
    const buckets = this.getPingBuckets(monitorId);
    if (!buckets.length) {
      return 0;
    }

    const validBuckets = buckets.filter(
      (bucket): bucket is PingBucket => bucket !== null,
    );

    if (!validBuckets.length) {
      return 0;
    }

    const totalSuccess = validBuckets.reduce(
      (sum, bucket) => sum + bucket.successCount,
      0,
    );
    const totalFailure = validBuckets.reduce(
      (sum, bucket) => sum + bucket.failureCount,
      0,
    );
    const totalPings = totalSuccess + totalFailure;

    if (totalPings === 0) {
      return 0;
    }

    return (totalSuccess / totalPings) * 100;
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

    delete this._monitors[monitorId];
    delete this._monitorPings[monitorId];
  }

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

  async createMonitor(
    projectId: string,
    dto: CreateMonitorDto,
  ): Promise<string> {
    const createdMonitor = await monitoringService.createMonitor(
      projectId,
      dto,
    );

    this._unclaimedMonitors[createdMonitor.id] = createdMonitor;
    this._monitorPings[createdMonitor.id] = [];

    return createdMonitor.id;
  }

  getUnclaimedMonitor(monitorId: string): Monitor | undefined {
    return this._unclaimedMonitors[monitorId];
  }

  hasSuccessfulPing(monitorId: string): boolean {
    const pings = this._monitorPings[monitorId];
    if (!pings || pings.length === 0) {
      return false;
    }

    return pings.some(
      (ping) => ping.statusCode >= 200 && ping.statusCode < 400,
    );
  }

  async claimMonitor(httpMonitorId: string): Promise<Monitor> {
    const claimedMonitor = await monitoringService.claimMonitor(httpMonitorId);

    this._monitors[claimedMonitor.id] = claimedMonitor;
    delete this._unclaimedMonitors[claimedMonitor.id];

    if (!this._monitorPings[claimedMonitor.id]) {
      this._monitorPings[claimedMonitor.id] = [];
    }

    return claimedMonitor;
  }

  async updateMonitor(
    monitorId: string,
    dto: UpdateMonitorDto,
  ): Promise<Monitor> {
    const updatedMonitor = await monitoringService.updateMonitor(
      monitorId,
      dto,
    );

    if (this._monitors[monitorId]) {
      this._monitors[monitorId] = updatedMonitor;
    }

    if (this._unclaimedMonitors[monitorId]) {
      this._unclaimedMonitors[monitorId] = updatedMonitor;
    }

    return updatedMonitor;
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
            createdAt: new Date(pingData.createdAt),
          });

          // Update status for both claimed and unclaimed monitors
          if (this._monitors[pingData.httpMonitorId]) {
            this._monitors[pingData.httpMonitorId].lastStatusCode =
              pingData.statusCode;
          }

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

  private async _fetchMonitors(clusterId: string): Promise<void> {
    try {
      const data = await monitoringService.getMonitors(clusterId);
      const newMonitors = arrayToObject<Monitor>(data, 'id');

      for (const [id, monitor] of Object.entries(newMonitors) as [
        string,
        Monitor,
      ][]) {
        if (!this._monitors[id]) {
          this._monitors[id] = monitor;
        }
      }

      for (const monitor of data) {
        if (!this._monitorPings[monitor.id]) {
          this._monitorPings[monitor.id] = [];
        }
      }
    } catch (error) {
      logger.error('Failed to fetch monitors:', error);
      throw new Error('Failed to fetch monitors');
    }
  }

  private async _fetchPings(
    projectId: string,
    monitorId: string,
    limit: number = 60,
  ): Promise<void> {
    const data = await monitoringService.getMonitorPings({
      projectId,
      monitorId,
      limit,
    });

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
