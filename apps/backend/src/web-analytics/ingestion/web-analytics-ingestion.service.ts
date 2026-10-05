import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnApplicationShutdown,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isbot } from 'isbot';
import { CollectWebEventsBody } from '../core/dto/collect-web-events.body';
import { WebEventClickhouseEntity } from '../core/entities/web-event.clickhouse-entity';
import { WebAnalyticsReadService } from '../read/web-analytics-read.service';
import {
  WebAnalyticsWriteService,
  WEB_ANALYTICS_QUEUE_LOCK,
} from '../write/web-analytics-write.service';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { getClusterPlanConfig } from '../../shared/configs/cluster-plan-configs';
import { RedisService, TtlOverwriteStrategy } from '../../shared/redis/redis.service';
import { WEB_ANALYTICS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { errorMessage } from '../../shared/utils/error-message';

const QUEUE_KEY = 'web-analytics:queue';
// ponytail: One flush lock processes up to 1,000 events per second; shard queues by domain above that rate.

@Injectable()
export class WebAnalyticsIngestionService implements OnApplicationShutdown {
  constructor(
    private readonly read: WebAnalyticsReadService,
    private readonly write: WebAnalyticsWriteService,
    private readonly clusters: ClusterReadCachedService,
    private readonly redis: RedisService,
    @Inject(WEB_ANALYTICS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  public async collect(
    body: CollectWebEventsBody,
    origin: string | undefined,
    userAgent: string,
  ): Promise<void> {
    const site = await this.read.readSiteCached(body.siteId);
    if (!site) throw new ForbiddenException('Unknown site');
    if (!origin || !/^https?:\/\/[^/]+$/.test(origin) || !URL.canParse(origin))
      throw new ForbiddenException('A browser Origin header is required');
    if (isbot(userAgent)) return;
    const config = getClusterPlanConfig(await this.clusters.readTier(site.clusterId)).webAnalytics;
    const now = new Date();
    const sentAt = new Date(body.sentAt);
    const rows = body.events.flatMap(
      (event) =>
        WebEventClickhouseEntity.fromNormalized(
          event,
          site,
          origin,
          userAgent,
          config.retentionDays,
          sentAt,
          now,
        ) ?? [],
    );
    if (!rows.length) return;
    const hour = now.toISOString().slice(0, 13);
    const count = await this.redis.incrementBy(
      `web-analytics:usage:${site.clusterId}:${hour}`,
      rows.length,
      { ttlSeconds: 3600, ttlOverwriteStrategy: TtlOverwriteStrategy.SetOnlyIfNoExpiry },
    );
    if (count > config.rateLimitPerHour)
      throw new HttpException(
        'Web analytics event limit reached for this hour',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    const accepted = await this.redis
      .getClient()
      .eval(
        "if redis.call('LLEN', KEYS[1]) + #ARGV > 100000 then return 0 end redis.call('RPUSH', KEYS[1], unpack(ARGV)) return 1",
        { keys: [QUEUE_KEY], arguments: rows.map((row) => JSON.stringify(row)) },
      );
    if (!accepted)
      throw new ServiceUnavailableException('Web analytics is busy. Try again shortly');
  }

  @Cron(CronExpression.EVERY_SECOND, { waitForCompletion: true })
  public async runCron(): Promise<void> {
    try {
      await this.processQueue();
    } catch (error) {
      this.logger.error('Failed to flush web events', { error: errorMessage(error) });
    }
  }

  public async processQueue(): Promise<void> {
    const client = this.redis.getClient();
    await this.write.withQueueLock(async (lock) => {
      const pending = await client.lRange(QUEUE_KEY, 0, 999);
      if (!pending.length) return;
      const rows = pending.flatMap((entry) => this.parseQueued(entry));
      const sites = await this.read.readExistingSiteIds([
        ...new Set(rows.map((row) => row.site_id)),
      ]);
      const valid = rows.filter((row) => sites.has(row.site_id));
      const written = await this.write.insertEvents(valid);
      if (written < valid.length)
        this.logger.error('ClickHouse skipped unreadable web events', {
          skipped: valid.length - written,
        });
      await client.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then redis.call('LTRIM', KEYS[2], ARGV[2], -1) return 1 end return 0",
        { keys: [WEB_ANALYTICS_QUEUE_LOCK, QUEUE_KEY], arguments: [lock, String(pending.length)] },
      );
    });
  }

  private parseQueued(entry: string): WebEventClickhouseEntity[] {
    let row: WebEventClickhouseEntity | null;
    try {
      row = JSON.parse(entry) as WebEventClickhouseEntity | null;
    } catch {
      row = null;
    }
    if (typeof row?.site_id === 'string' && /^[0-9a-f]{24}$/.test(row.site_id)) return [row];
    this.logger.error('Skipped unreadable queued web event', { sample: entry.slice(0, 200) });
    return [];
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.runCron();
  }
}
