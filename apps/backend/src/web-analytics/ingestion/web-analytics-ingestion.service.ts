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
import { createHash, randomBytes } from 'node:crypto';
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
import { ClickhouseUtils } from '../../clickhouse/clickhouse.utils';

const QUEUE_KEY = 'web-analytics:queue';
// ponytail: One flush lock processes up to 1,000 events per second; shard queues by domain above that rate.

const DAY_MS = 86_400_000;
const SESSION_IDLE_SECONDS = 1800;

type Session = {
  id: string;
  startedAt: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  clickId: string;
};

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
    ip: string,
  ): Promise<void> {
    const site = await this.read.readSiteCached(body.siteId);
    if (!site) throw new ForbiddenException('Unknown site');
    if (!origin || !/^https?:\/\/[^/]+$/.test(origin) || !URL.canParse(origin))
      throw new ForbiddenException('A browser Origin header is required');
    if (isbot(userAgent)) return;
    const config = getClusterPlanConfig(await this.clusters.readTier(site.clusterId)).webAnalytics;
    const now = new Date();
    const sentAt = new Date(body.sentAt);
    const { rows, sessionKey, session } = await this.sessionize(
      site.id,
      ip,
      userAgent,
      now,
      body.events.flatMap(
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
      ),
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
    await this.redis.set(sessionKey, JSON.stringify(session), SESSION_IDLE_SECONDS);
  }

  private async sessionize(
    siteId: string,
    ip: string,
    userAgent: string,
    now: Date,
    events: WebEventClickhouseEntity[],
  ): Promise<{ rows: WebEventClickhouseEntity[]; sessionKey: string; session: Session | null }> {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const saltKey = (day: number): string =>
      `web-analytics:salt:${new Date(day).toISOString().slice(0, 10)}`;
    const client = this.redis.getClient();
    const candidate = randomBytes(32).toString('hex');
    const [, salt, yesterdaySalt] = await client
      .multi()
      .set(saltKey(today), candidate, {
        condition: 'NX',
        expiration: {
          type: 'EX',
          value: Math.ceil((today + DAY_MS + 30 * 60_000 - now.getTime()) / 1000),
        },
      })
      .get(saltKey(today))
      .get(saltKey(today - DAY_MS))
      .execTyped();
    const hash = (daySalt: string): string =>
      createHash('sha256').update(`${daySalt}:${siteId}:${ip}:${userAgent}`).digest('hex');
    const visitorIds = [hash(salt ?? candidate)];
    if (yesterdaySalt && now.getTime() - today < 30 * 60_000) visitorIds.push(hash(yesterdaySalt));
    const keys = visitorIds.map((id) => `web-analytics:session:${siteId}:${id}`);
    const stored = await client.mGet(keys);
    const live = stored[1] ? 1 : 0;
    let session = stored[live] ? (JSON.parse(stored[live]) as Session) : null;
    const rows: WebEventClickhouseEntity[] = [];
    for (const event of events) {
      const at = ClickhouseUtils.clickhouseDateToJsDate(event.created_at);
      if (!session || at.getTime() - Date.parse(session.startedAt) >= DAY_MS) {
        if (event.name === 'pageleave') continue;
        const fresh: Session = {
          id: session
            ? createHash('sha256').update(session.id).digest('hex')
            : randomBytes(32).toString('hex'),
          startedAt: at.toISOString(),
          referrer: event.referrer,
          utmSource: event.utm_source,
          utmMedium: event.utm_medium,
          utmCampaign: event.utm_campaign,
          utmTerm: event.utm_term,
          clickId: event.click_id,
        };
        if (session) session = fresh;
        else {
          const [, claimed] = await client
            .multi()
            .set(keys[live], JSON.stringify(fresh), {
              condition: 'NX',
              expiration: { type: 'EX', value: SESSION_IDLE_SECONDS },
            })
            .get(keys[live])
            .execTyped();
          session = claimed ? (JSON.parse(claimed) as Session) : fresh;
        }
      }
      rows.push({
        ...event,
        visitor_id: visitorIds[live],
        session_id: session.id,
        referrer: session.referrer,
        utm_source: session.utmSource,
        utm_medium: session.utmMedium,
        utm_campaign: session.utmCampaign,
        utm_term: session.utmTerm,
        click_id: session.clickId,
      });
    }
    return { rows, sessionKey: keys[live], session };
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
