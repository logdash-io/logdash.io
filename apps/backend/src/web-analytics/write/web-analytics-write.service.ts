import { ClickHouseClient } from '@clickhouse/client';
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebAnalyticsSiteEntity } from '../core/entities/web-analytics-site.entity';
import { WebAnalyticsSiteNormalized } from '../core/entities/web-analytics-site.interface';
import { WebAnalyticsSiteSerializer } from '../core/entities/web-analytics-site.serializer';
import { RedisService } from '../../shared/redis/redis.service';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { AuditLogEntityAction } from '../../audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';
import { WebEventClickhouseEntity } from '../core/entities/web-event.clickhouse-entity';

export const WEB_ANALYTICS_QUEUE_LOCK = 'web-analytics:flush-lock';

@Injectable()
export class WebAnalyticsWriteService {
  constructor(
    @InjectModel(WebAnalyticsSiteEntity.name) private readonly model: Model<WebAnalyticsSiteEntity>,
    private readonly redis: RedisService,
    private readonly clickhouse: ClickHouseClient,
    private readonly auditLog: AuditLog,
  ) {}

  public async configure(
    clusterId: string,
    origins: string[],
    actorUserId: string,
  ): Promise<WebAnalyticsSiteNormalized> {
    const normalizedOrigins = [...new Set(origins.map((origin) => this.normalizeOrigin(origin)))];
    const site = await this.model
      .findOneAndUpdate(
        { clusterId },
        { $set: { origins: normalizedOrigins } },
        { upsert: true, returnDocument: 'after' },
      )
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    const normalized = WebAnalyticsSiteSerializer.normalize(site);
    await this.redis.del(`web-analytics:site:${normalized.id}`);
    void this.auditLog.create({
      userId: actorUserId,
      actor: Actor.User,
      action: AuditLogEntityAction.Update,
      relatedDomain: RelatedDomain.WebAnalytics,
      relatedEntityId: normalized.id,
    });
    return normalized;
  }

  public async deleteByClusterId(clusterId: string): Promise<void> {
    const site = await this.model.findOne({ clusterId }).lean<WebAnalyticsSiteEntity>().exec();
    if (!site) return;
    for (let attempt = 0; attempt < 100; attempt++) {
      const deleted = await this.withQueueLock(async () => {
        await this.clickhouse.command({
          query: 'DELETE FROM web_events WHERE cluster_id = {clusterId:FixedString(24)}',
          query_params: { clusterId },
        });
        await this.model.deleteOne({ _id: site._id }).exec();
        await this.redis.del(`web-analytics:site:${site._id.toString()}`);
      });
      if (deleted) return;
      await delay(50);
    }
    throw new ServiceUnavailableException(
      'Web analytics is processing events. Try deleting the domain again shortly',
    );
  }

  public async insertEvents(rows: WebEventClickhouseEntity[]): Promise<number> {
    if (!rows.length) return 0;
    const result = await this.clickhouse.insert({
      table: 'web_events',
      values: rows,
      format: 'JSONEachRow',
      clickhouse_settings: { input_format_allow_errors_ratio: 1 },
    });
    return Number(result.summary?.written_rows ?? rows.length);
  }

  public async withQueueLock(operation: (lock: string) => Promise<void>): Promise<boolean> {
    const client = this.redis.getClient();
    const lock = randomUUID();
    if (!(await client.set(WEB_ANALYTICS_QUEUE_LOCK, lock, { NX: true, EX: 60 }))) return false;
    try {
      await operation(lock);
      return true;
    } finally {
      await client.eval(
        "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
        { keys: [WEB_ANALYTICS_QUEUE_LOCK], arguments: [lock] },
      );
    }
  }

  private normalizeOrigin(value: string): string {
    try {
      const url = new URL(value);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if (
        (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
        url.username ||
        url.password ||
        url.pathname !== '/' ||
        url.search ||
        url.hash
      )
        throw new Error('Invalid origin');
      return url.origin;
    } catch {
      throw new BadRequestException(
        'Use an HTTPS website origin, or HTTP on localhost, without a path, credentials or query',
      );
    }
  }
}
