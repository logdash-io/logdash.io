import { ClickHouseClient } from '@clickhouse/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import {
  WebAnalyticsSiteEntity,
  WebAnalyticsViewEntity,
} from '../core/entities/web-analytics-site.entity';
import {
  WebAnalyticsInsightNormalized,
  WebAnalyticsLayoutNormalized,
  WebAnalyticsSiteNormalized,
} from '../core/entities/web-analytics-site.interface';
import {
  WebAnalyticsInsightSerializer,
  WebAnalyticsSiteSerializer,
} from '../core/entities/web-analytics-site.serializer';
import {
  MAX_WEB_ANALYTICS_INSIGHTS,
  ReorderWebAnalyticsInsightsBody,
  WEB_ANALYTICS_INSIGHT_PLACEMENT_KEYS,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightPlacement,
} from '../core/dto/web-analytics-insight.body';
import { WebAnalyticsViewBody } from '../core/dto/web-analytics-views.body';
import { RedisService } from '../../shared/redis/redis.service';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { AuditLogEntityAction } from '../../audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';
import { WebEventClickhouseEntity } from '../core/entities/web-event.clickhouse-entity';

export const WEB_ANALYTICS_QUEUE_LOCK = 'web-analytics:flush-lock';

const INSIGHT_CONFIG_KEYS = [
  'type',
  'title',
  'days',
  'mode',
  'layout',
  'steps',
  'events',
  'filters',
  'bucket',
  'measure',
  'property',
  'binSize',
  'tabs',
];

const ABSENT_CONFIG = Object.fromEntries(INSIGHT_CONFIG_KEYS.map((key) => [key, null]));

type Patch = { $set: Record<string, unknown>; $unset: Record<string, ''> };

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

  public async updateGoals(
    clusterId: string,
    goals: string[],
    actorUserId: string,
  ): Promise<WebAnalyticsSiteNormalized> {
    const site = await this.model
      .findOneAndUpdate(
        { clusterId },
        { $set: { goals }, $setOnInsert: { origins: [] } },
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

  public async ensureSite(clusterId: string): Promise<WebAnalyticsSiteNormalized> {
    const site = await this.model
      .findOneAndUpdate(
        { clusterId },
        { $setOnInsert: { clusterId, origins: [] } },
        { upsert: true, returnDocument: 'after' },
      )
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    return WebAnalyticsSiteSerializer.normalize(site);
  }

  public async createInsight(
    clusterId: string,
    insight: WebAnalyticsInsightConfig,
    actorUserId: string,
  ): Promise<WebAnalyticsInsightNormalized> {
    await this.assertPlacements(clusterId, [insight]);
    await this.ensureSite(clusterId);
    const _id = new Types.ObjectId();
    const stored = Object.fromEntries(
      Object.entries(insight).filter(([, value]) => value !== null),
    );
    const site = await this.model
      .findOneAndUpdate(
        { clusterId, [`insights.${MAX_WEB_ANALYTICS_INSIGHTS - 1}`]: { $exists: false } },
        { $push: { insights: { ...stored, _id } } },
        { returnDocument: 'after' },
      )
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    if (!site)
      throw new BadRequestException(
        `A domain keeps at most ${MAX_WEB_ANALYTICS_INSIGHTS} insights. Remove one first`,
      );
    this.audit(actorUserId, AuditLogEntityAction.Create, _id.toString());
    return this.pickInsight(site, _id.toString());
  }

  public async updateInsight(
    clusterId: string,
    insightId: string,
    insight: WebAnalyticsInsightConfig,
    actorUserId: string,
  ): Promise<WebAnalyticsInsightNormalized> {
    const _id = this.insightObjectId(insightId);
    await this.assertPlacements(clusterId, [insight]);
    const site = await this.model
      .findOneAndUpdate(
        { clusterId, 'insights._id': _id },
        this.operators(this.patch({ ...ABSENT_CONFIG, ...insight }, 'insights.$.')),
        { returnDocument: 'after' },
      )
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    if (!site) throw new NotFoundException('Insight not found');
    this.audit(actorUserId, AuditLogEntityAction.Update, insightId);
    return this.pickInsight(site, insightId);
  }

  public async deleteInsight(
    clusterId: string,
    insightId: string,
    actorUserId: string,
  ): Promise<void> {
    const _id = this.insightObjectId(insightId);
    const result = await this.model
      .updateOne({ clusterId, 'insights._id': _id }, { $pull: { insights: { _id } } })
      .exec();
    if (!result.modifiedCount) throw new NotFoundException('Insight not found');
    this.audit(actorUserId, AuditLogEntityAction.Delete, insightId);
  }

  public async reorderInsights(
    clusterId: string,
    { ids, placements }: ReorderWebAnalyticsInsightsBody,
    actorUserId: string,
  ): Promise<WebAnalyticsLayoutNormalized> {
    if (!ids && !placements) throw new BadRequestException('Pass ids, placements or both');
    let site = await this.model
      .findOne({ clusterId })
      .select('insights views')
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    const known = new Set((site?.insights ?? []).map((insight) => insight._id.toString()));
    if (placements?.some((placement) => !known.has(placement.id)))
      throw new BadRequestException('Unknown insight');
    this.assertViews(site?.views ?? [], placements ?? []);
    if (ids) site = await this.applyOrder(clusterId, ids);
    if (placements) site = (await this.applyPlacements(clusterId, placements)) ?? site;
    const touched = new Set([...(ids ?? []), ...(placements ?? []).map(({ id }) => id)]);
    for (const id of touched) this.audit(actorUserId, AuditLogEntityAction.Update, id);
    return WebAnalyticsSiteSerializer.normalizeLayout(site);
  }

  public async updateViews(
    clusterId: string,
    views: WebAnalyticsViewBody[],
    actorUserId: string,
  ): Promise<WebAnalyticsLayoutNormalized> {
    const current = await this.model
      .findOne({ clusterId })
      .select('views')
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    const site = await this.model
      .findOneAndUpdate(
        { clusterId },
        {
          $set: { views: this.buildViews(current?.views ?? [], views) },
          $setOnInsert: { origins: [] },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    this.audit(actorUserId, AuditLogEntityAction.Update, site._id.toString());
    return WebAnalyticsSiteSerializer.normalizeLayout(site);
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
        await this.redis.del(`web-analytics:cluster-site:${clusterId}`);
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

  private async applyOrder(clusterId: string, ids: string[]): Promise<WebAnalyticsSiteEntity> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const site = await this.model
      .findOneAndUpdate(
        { clusterId, insights: { $size: ids.length }, 'insights._id': { $all: objectIds } },
        [
          {
            $set: {
              insights: {
                $map: {
                  input: objectIds,
                  as: 'id',
                  in: {
                    $first: {
                      $filter: { input: '$insights', cond: { $eq: ['$$this._id', '$$id'] } },
                    },
                  },
                },
              },
            },
          },
        ],
        { returnDocument: 'after', updatePipeline: true },
      )
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    if (!site) throw new BadRequestException('ids must list every insight of the domain once');
    return site;
  }

  private async applyPlacements(
    clusterId: string,
    placements: (WebAnalyticsInsightPlacement & { id: string })[],
  ): Promise<WebAnalyticsSiteEntity | null> {
    const changes = placements.filter((placement) =>
      WEB_ANALYTICS_INSIGHT_PLACEMENT_KEYS.some((key) => placement[key] !== undefined),
    );
    if (!changes.length) return null;
    const patch: Patch = { $set: {}, $unset: {} };
    changes.forEach((placement, index) =>
      this.patch(this.placementOf(placement), `insights.$[e${index}].`, patch),
    );
    return this.model
      .findOneAndUpdate({ clusterId }, this.operators(patch), {
        arrayFilters: changes.map((placement, index) => ({
          [`e${index}._id`]: new Types.ObjectId(placement.id),
        })),
        returnDocument: 'after',
      })
      .lean<WebAnalyticsSiteEntity>()
      .exec();
  }

  private placementOf(values: WebAnalyticsInsightPlacement): Record<string, unknown> {
    return Object.fromEntries(
      WEB_ANALYTICS_INSIGHT_PLACEMENT_KEYS.map((key) => [key, values[key]]),
    );
  }

  private patch(
    values: Record<string, unknown>,
    prefix: string,
    into: Patch = { $set: {}, $unset: {} },
  ): Patch {
    for (const [key, value] of Object.entries(values)) {
      if (value === null) into.$unset[`${prefix}${key}`] = '';
      else if (value !== undefined) into.$set[`${prefix}${key}`] = value;
    }
    return into;
  }

  private operators(patch: Patch): UpdateQuery<WebAnalyticsSiteEntity> {
    return Object.fromEntries(
      Object.entries(patch).filter(([, fields]) => Object.keys(fields).length),
    );
  }

  private async assertPlacements(
    clusterId: string,
    placements: WebAnalyticsInsightPlacement[],
  ): Promise<void> {
    if (!placements.some(({ view, section }) => view || section)) return;
    const site = await this.model
      .findOne({ clusterId })
      .select('views')
      .lean<WebAnalyticsSiteEntity>()
      .exec();
    this.assertViews(site?.views ?? [], placements);
  }

  private assertViews(
    views: WebAnalyticsViewEntity[],
    placements: WebAnalyticsInsightPlacement[],
  ): void {
    for (const { view, section } of placements) {
      const owner = view ? views.find((entry) => entry._id.toString() === view) : undefined;
      if (view && !owner) throw new BadRequestException('Unknown view');
      const scope = owner ? [owner] : views;
      if (
        section &&
        !scope.some((entry) => entry.sections.some((child) => child._id.toString() === section))
      )
        throw new BadRequestException('Unknown section');
    }
  }

  private buildViews(
    current: WebAnalyticsViewEntity[],
    views: WebAnalyticsViewBody[],
  ): Pick<WebAnalyticsViewEntity, '_id' | 'name' | 'traffic' | 'sections'>[] {
    const ids = new Set<string>();
    const claim = (id: string): void => {
      if (ids.has(id)) throw new BadRequestException('An id appears twice');
      ids.add(id);
    };
    const names = new Set<string>();
    return views.map((view) => {
      const existing = current.find((entry) => entry._id.toString() === view.id);
      if (view.id) {
        if (!existing) throw new BadRequestException('Unknown view');
        claim(view.id);
      }
      if (names.has(view.name.toLowerCase()))
        throw new BadRequestException('View names must be unique');
      names.add(view.name.toLowerCase());
      const titles = new Set<string>();
      const sections = (view.sections ?? []).map((section) => {
        if (section.id) {
          if (!existing?.sections.some((entry) => entry._id.toString() === section.id))
            throw new BadRequestException('Unknown section');
          claim(section.id);
        }
        if (titles.has(section.title.toLowerCase()))
          throw new BadRequestException('Section titles must be unique within a view');
        titles.add(section.title.toLowerCase());
        return {
          _id: new Types.ObjectId(section.id),
          title: section.title,
          collapsed: section.collapsed ?? false,
        };
      });
      return {
        _id: new Types.ObjectId(view.id),
        name: view.name,
        traffic: view.traffic ?? false,
        sections,
      };
    });
  }

  private insightObjectId(insightId: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(insightId)) throw new NotFoundException('Insight not found');
    return new Types.ObjectId(insightId);
  }

  private pickInsight(
    site: WebAnalyticsSiteEntity,
    insightId: string,
  ): WebAnalyticsInsightNormalized {
    const insight = (site.insights ?? []).find((entry) => entry._id.toString() === insightId);
    if (!insight) throw new NotFoundException('Insight not found');
    return WebAnalyticsInsightSerializer.normalize(insight);
  }

  private audit(actorUserId: string, action: AuditLogEntityAction, insightId: string): void {
    void this.auditLog.create({
      userId: actorUserId,
      actor: Actor.User,
      action,
      relatedDomain: RelatedDomain.WebAnalytics,
      relatedEntityId: insightId,
    });
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
