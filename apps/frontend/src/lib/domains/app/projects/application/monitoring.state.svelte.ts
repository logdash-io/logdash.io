import { clusterPulseState } from '$lib/domains/app/clusters/application/cluster-pulse.state.svelte.js';
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
import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error.js';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
import {
  monitoringService,
  type CreateMonitorDto,
  type UpdateMonitorDto,
} from '$lib/domains/app/projects/infrastructure/monitoring.service';
import {
  bucketUptime,
  type PingBucket,
  type PingBucketPeriod,
} from '$lib/domains/app/projects/domain/monitoring/ping-bucket';

const logger = createLogger('monitoring.state', false);

const MONITORING_TIME_RANGE_KEY = 'monitoring_time_range';
const BUCKETS_REFRESH_MS = 60_000;

// todo: divide api calls responsibility from state
class MonitoringState {
  private _monitors = $state<Record<Monitor['id'], Monitor>>({});
  private _monitorPings = $state<Record<Monitor['id'], HttpPing[]>>({});
  private _unclaimedMonitors = $state<Record<Monitor['id'], Monitor>>({});
  private _pingBuckets = $state<Record<Monitor['id'], (PingBucket | null)[]>>(
    {},
  );
  private _timeRange = $state<PingBucketPeriod>('90d');
  private _bucketsRefreshedAt: Record<Monitor['id'], number> = {};
  private syncConnection: EventSource | null = null;
  private _streamGeneration = 0;
  private _unsubscribe: (() => void) | null = null;
  private _pingsAbortControllers = new Map<string, AbortController>();

  get monitors(): Monitor[] {
    return this._getSortedMonitors();
  }

  get timeRange(): PingBucketPeriod {
    return this._timeRange;
  }

  public setTimeRange(period: PingBucketPeriod): void {
    this._timeRange = period;
    this._saveTimeRangePreference(period);
    void this.reloadAllPingBuckets();
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

  public hasNotificationChannel(monitorId: string, channelId: string): boolean {
    const monitor = this._monitors[monitorId];
    if (!monitor) {
      return false;
    }
    return (
      monitor.notificationChannelsIds &&
      monitor.notificationChannelsIds.includes(channelId)
    );
  }

  public async addNotificationChannel(
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

    if (await this._saveNotificationChannel(monitorId, channelId, true)) {
      toast.success(`Notification channel added to monitor ${monitor.name}`);
    }
  }

  public async removeNotificationChannel(
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

    if (await this._saveNotificationChannel(monitorId, channelId, false)) {
      toast.success(
        `Notification channel removed from monitor ${monitor.name}`,
      );
    }
  }

  private async _saveNotificationChannel(
    monitorId: string,
    channelId: string,
    attached: boolean,
  ): Promise<boolean> {
    this._setNotificationChannel(monitorId, channelId, attached);

    try {
      await httpClient.put(`/http_monitors/${monitorId}`, {
        notificationChannelsIds:
          this._monitors[monitorId]?.notificationChannelsIds ?? [],
      });

      return true;
    } catch (error) {
      this._setNotificationChannel(monitorId, channelId, !attached);
      toast.error(
        readHttpErrorMessage(error) ??
          'Failed to update the notification channels',
      );

      return false;
    }
  }

  private _setNotificationChannel(
    monitorId: string,
    channelId: string,
    attached: boolean,
  ): void {
    const monitor = this._monitors[monitorId];

    if (!monitor) {
      return;
    }

    const others = monitor.notificationChannelsIds.filter(
      (id) => id !== channelId,
    );
    monitor.notificationChannelsIds = attached
      ? [...others, channelId]
      : others;
  }

  public toggleNotificationChannel(
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

  public monitorsOf(clusterId: string): Monitor[] {
    return this.monitors.filter((monitor) => monitor.clusterId === clusterId);
  }

  public set(monitors: Monitor[]): void {
    this._monitors = arrayToObject(monitors, 'id');
  }

  public async sync(clusterId: string): Promise<void> {
    try {
      await Promise.all([
        this._syncClusterMonitors(clusterId),
        this.reloadAllPingBuckets(),
      ]);
    } catch (error) {
      logger.error('Failed to sync monitors:', error);
    }
  }

  public unsync(): void {
    logger.debug('unsyncing monitors...');
    this._stopMonitorsSync();
  }

  public pauseSync(): void {
    this._pauseMonitorSync();
  }

  public async resumeSync(clusterId: string): Promise<void> {
    return this._resumeMonitorSync(clusterId);
  }

  public monitoringPings(monitorId: string): HttpPing[] {
    return this._getSortedPings(this._monitorPings[monitorId]);
  }

  public getMonitorById(monitorId: string): Monitor | undefined {
    return this._monitors[monitorId];
  }

  public getMonitorByUrl(url: string): Monitor | undefined {
    return this.monitors.find((monitor) => monitor.url === url);
  }

  public async load(clusterId: string): Promise<void> {
    logger.debug('loading monitors...');
    await this._fetchMonitors(clusterId).catch(() => undefined);
  }

  public loadMonitorPings(
    clusterId: string,
    monitorId: string,
    limit: number = 60,
  ): Promise<boolean> {
    return this._fetchPings(clusterId, monitorId, limit);
  }

  public getPingBuckets(monitorId: string): (PingBucket | null)[] {
    return this._pingBuckets[monitorId] || [];
  }

  public async loadPingBuckets(monitorId: string): Promise<void> {
    this._timeRange = this._loadTimeRangePreference();
    try {
      const response = await monitoringService.getPingBuckets(
        monitorId,
        this._timeRange,
      );
      this._pingBuckets[monitorId] = response.buckets.reverse();
    } catch (error) {
      logger.error('Failed to load ping buckets:', error);
    }
  }

  private _refreshPingBuckets(monitorId: string): void {
    const now = Date.now();

    if (now - (this._bucketsRefreshedAt[monitorId] ?? 0) < BUCKETS_REFRESH_MS) {
      return;
    }

    this._bucketsRefreshedAt[monitorId] = now;
    void this.loadPingBuckets(monitorId);
  }

  public async reloadAllPingBuckets(): Promise<void> {
    const monitorIds = Object.keys(this._monitors);
    const promises = monitorIds.map((monitorId) =>
      this.loadPingBuckets(monitorId),
    );

    await Promise.allSettled(promises);
  }

  public calculateUptime(monitorId: string): number | null {
    return bucketUptime(this.getPingBuckets(monitorId));
  }

  public async deleteMonitor(monitorId: string): Promise<void> {
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
    clusterPulseState.setMonitorDown(monitor.clusterId, monitorId, false);
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

  private async _syncClusterMonitors(clusterId: string): Promise<void> {
    this.unsync();
    logger.debug('syncing monitors...', clusterId);
    this._monitorPings = {};

    await Promise.all([
      this._fetchMonitors(clusterId),
      this._openMonitorStream(clusterId),
    ]);
  }

  private _stopMonitorsSync(): void {
    this._streamGeneration += 1;
    logger.debug('unsyncing monitors...');
    this._unsubscribe?.();
    this.syncConnection?.close();
    this.syncConnection = null;
  }

  private _pauseMonitorSync(): void {
    this._streamGeneration += 1;
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

  public async createMonitor(
    clusterId: string,
    dto: CreateMonitorDto,
  ): Promise<string> {
    const createdMonitor = await monitoringService.createMonitor(
      clusterId,
      dto,
    );

    this._unclaimedMonitors[createdMonitor.id] = createdMonitor;
    this._monitorPings[createdMonitor.id] = [];

    return createdMonitor.id;
  }

  public getUnclaimedMonitor(monitorId: string): Monitor | undefined {
    return this._unclaimedMonitors[monitorId];
  }

  public hasSuccessfulPing(monitorId: string): boolean {
    const pings = this._monitorPings[monitorId];
    if (!pings || pings.length === 0) {
      return false;
    }

    return pings.some(
      (ping) => ping.statusCode >= 200 && ping.statusCode < 400,
    );
  }

  public async claimMonitor(httpMonitorId: string): Promise<Monitor> {
    await monitoringService.claimMonitor(httpMonitorId);

    const claimedMonitor = await this._readClaimedMonitor(httpMonitorId);

    this._monitors[httpMonitorId] = claimedMonitor;
    delete this._unclaimedMonitors[httpMonitorId];
    clusterPulseState.setMonitorDown(
      claimedMonitor.clusterId,
      claimedMonitor.id,
      claimedMonitor.lastStatus === 'down',
    );

    if (!this._monitorPings[httpMonitorId]) {
      this._monitorPings[httpMonitorId] = [];
    }

    return claimedMonitor;
  }

  private async _readClaimedMonitor(httpMonitorId: string): Promise<Monitor> {
    const cachedMonitor =
      this._unclaimedMonitors[httpMonitorId] ?? this._monitors[httpMonitorId];

    try {
      const clusterMonitors = await monitoringService.getMonitors(
        cachedMonitor.clusterId,
      );

      return (
        clusterMonitors.find((monitor) => monitor.id === httpMonitorId) ??
        cachedMonitor
      );
    } catch (error) {
      logger.error('Failed to read the claimed monitor:', error);

      return cachedMonitor;
    }
  }

  public async updateMonitor(
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
    const generation = this._streamGeneration;

    return new Promise((resolve) => {
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

      const onOpen = (event: Event): void => {
        logger.debug('monitor SSE opened', event);
        resolve();
      };

      const onError = (event: Event): void => {
        logger.error('Monitor SSE connection error:', event);

        this._unsubscribe?.();

        logger.debug('Attempting to reconnect monitors in 3 seconds...');
        setTimeout(() => {
          if (generation === this._streamGeneration) {
            void this._openMonitorStream(clusterId);
          }
        }, 3000);

        resolve();
      };

      const onMessage = (event: MessageEvent<string>): void => {
        try {
          logger.info('new monitor SSE message:', event);
          const pingData = JSON.parse(event.data) as HttpPingCreatedEvent;

          if (!this._monitorPings[pingData.httpMonitorId]) {
            this._monitorPings[pingData.httpMonitorId] = [];
          }

          this._monitorPings[pingData.httpMonitorId].push({
            ...pingData,
            createdAt: new Date(pingData.createdAt),
          });

          this._recordMonitorStatus(pingData);
          this._refreshPingBuckets(pingData.httpMonitorId);

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
        resolve();

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

  private _recordMonitorStatus(ping: HttpPingCreatedEvent): void {
    const monitor = this._monitors[ping.httpMonitorId];

    if (!monitor) {
      return;
    }

    monitor.lastStatusCode = ping.statusCode;
    monitor.lastStatus =
      ping.statusCode >= 200 && ping.statusCode < 400 ? 'up' : 'down';
    clusterPulseState.setMonitorDown(
      monitor.clusterId,
      monitor.id,
      monitor.lastStatus === 'down',
    );
  }

  private async _fetchMonitors(clusterId: string): Promise<void> {
    try {
      const data = await monitoringService.getMonitors(clusterId);

      for (const monitor of Object.values(this._monitors)) {
        if (monitor.clusterId === clusterId) {
          delete this._monitors[monitor.id];
        }
      }

      for (const monitor of data) {
        this._monitors[monitor.id] = monitor;
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
    clusterId: string,
    monitorId: string,
    limit: number = 60,
  ): Promise<boolean> {
    const existingController = this._pingsAbortControllers.get(monitorId);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    this._pingsAbortControllers.set(monitorId, controller);

    try {
      const data = await monitoringService.getMonitorPings({
        clusterId,
        monitorId,
        limit,
        signal: controller.signal,
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

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'CanceledError') {
        return true;
      }
      logger.error('Failed to load monitor pings:', error);

      return false;
    } finally {
      if (this._pingsAbortControllers.get(monitorId) === controller) {
        this._pingsAbortControllers.delete(monitorId);
      }
    }
  }
}

export const monitoringState = new MonitoringState();
