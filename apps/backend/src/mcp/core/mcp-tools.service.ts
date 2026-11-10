import { BadRequestException, ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { ClusterNormalized } from '../../cluster/core/entities/cluster.interface';
import { RequestUser } from '../../auth/core/types/authenticated-request.type';
import { Action, ACTION_RANK } from '../../personal-api-key/core/enums/action.enum';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';
import { getClusterPlanConfig } from '../../shared/configs/cluster-plan-configs';
import { EVENT_NAME, PROP_KEY } from '../../web-analytics/core/dto/collect-web-events.body';
import {
  ReadWebAnalyticsQuery,
  WEB_ANALYTICS_BREAKDOWNS,
  WEB_ANALYTICS_FILTER_DIMENSIONS,
  WebAnalyticsGranularity,
} from '../../web-analytics/core/dto/read-web-analytics.query';
import {
  MAX_WEB_ANALYTICS_INSIGHT_TABS,
  MAX_WEB_ANALYTICS_INSIGHTS,
  normalizeWebAnalyticsInsight,
  WEB_ANALYTICS_INSIGHT_BUCKETS,
  WebAnalyticsFunnelLayout,
  WebAnalyticsFunnelMode,
  WebAnalyticsInsightBody,
  WebAnalyticsInsightConfig,
  WebAnalyticsInsightOperator,
  WebAnalyticsInsightType,
  WebAnalyticsInsightWidth,
} from '../../web-analytics/core/dto/web-analytics-insight.body';
import {
  MAX_WEB_ANALYTICS_SECTIONS,
  MAX_WEB_ANALYTICS_VIEWS,
} from '../../web-analytics/core/dto/web-analytics-views.body';
import {
  WebAnalyticsInsightResult,
  WebAnalyticsInsightStep,
} from '../../web-analytics/core/dto/web-analytics-insight.response';
import { WebAnalyticsInsightReadService } from '../../web-analytics/read/web-analytics-insight-read.service';
import { WebAnalyticsReadService } from '../../web-analytics/read/web-analytics-read.service';
import { WebAnalyticsWriteService } from '../../web-analytics/write/web-analytics-write.service';
import {
  McpBreakdownArgs,
  McpClusterArgs,
  McpCohortTableArgs,
  McpCreateInsightArgs,
  McpDescribeArgs,
  McpDistributionArgs,
  McpEventsFunnelArgs,
  McpInsightIdArgs,
  McpPersonFunnelArgs,
  McpRangeArgs,
  McpReorderInsightsArgs,
  McpRetentionArgs,
  McpRunInsightArgs,
  McpSetViewsArgs,
  McpTrendArgs,
  McpUpdateInsightArgs,
} from './dto/mcp-tool.args';

export type McpToolContent = { content: { type: 'text'; text: string }[]; isError?: boolean };

export type McpToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; destructiveHint?: boolean; idempotentHint?: boolean };
};

type McpContext = { user: RequestUser; reach: ClusterNormalized[] };

type McpTool = McpToolDefinition & {
  action: Action;
  call: (plain: unknown, context: McpContext) => Promise<unknown>;
};

type McpCluster = { id: string; retentionDays: number };

const DAY_MS = 86_400_000;

const object = (
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});

const CLUSTER_ID = {
  type: 'string',
  pattern: '^[a-f0-9]{24}$',
  description: 'The domain id from describe',
};

const INSIGHT_ID = { type: 'string', pattern: '^[a-f0-9]{24}$', description: 'From list_insights' };

const DAYS = {
  type: 'integer',
  minimum: 1,
  maximum: 365,
  default: 30,
  description: 'The last N days, cut to the retention of the plan',
};

const TZ = {
  type: 'string',
  default: 'UTC',
  description: 'IANA time zone that days and buckets follow, such as Europe/Warsaw',
};

const FILTER = {
  type: 'array',
  maxItems: 10,
  items: {
    type: 'string',
    pattern: `^(${WEB_ANALYTICS_FILTER_DIMENSIONS.join('|')}|prop\\.[a-z][a-z0-9_]{0,39}):.+$`,
  },
  description:
    'dimension:value filters, all must match, such as channel:Reddit, source:reddit, campaign:r_sveltejs, page:/pricing, goal:signup or prop.plan:pro',
};

const PROPERTY_FILTERS = {
  type: 'array',
  maxItems: 5,
  items: object(
    {
      key: { type: 'string', pattern: PROP_KEY.source },
      op: { type: 'string', enum: Object.values(WebAnalyticsInsightOperator) },
      value: { type: 'string', minLength: 1, maxLength: 100 },
    },
    ['key', 'op', 'value'],
  ),
  description:
    'Event property filters. gt, gte, lt and lte compare numbers when the value is a number, and text otherwise, so YYYY-MM-DD dates compare in order',
};

const events = (
  minItems: number,
  maxItems: number,
  description: string,
): Record<string, unknown> => ({
  type: 'array',
  minItems,
  maxItems,
  items: object(
    {
      name: { type: 'string', pattern: EVENT_NAME.source },
      filters: PROPERTY_FILTERS,
    },
    ['name'],
  ),
  description,
});

const BUCKET = { type: 'string', enum: [...WEB_ANALYTICS_INSIGHT_BUCKETS] };

const STEPS = {
  type: 'array',
  minItems: 2,
  maxItems: 8,
  items: { type: 'string', pattern: '^(page|goal):.+$', maxLength: 1100 },
  description: 'Each step is page:<path> or goal:<event name>, such as ["page:/", "goal:signup"]',
};

const CHART = {
  type: {
    type: 'string',
    enum: Object.values(WebAnalyticsInsightType).filter(
      (type) => type !== WebAnalyticsInsightType.Tabs,
    ),
  },
  title: { type: 'string', minLength: 1, maxLength: 80 },
  days: DAYS,
  mode: {
    type: 'string',
    enum: Object.values(WebAnalyticsFunnelMode),
    description:
      'Funnels only. events (default) counts the events of each step and needs events; people follows each visitor through steps',
  },
  layout: {
    type: 'string',
    enum: Object.values(WebAnalyticsFunnelLayout),
    description:
      'Funnels only. columns (default) draws a bar per step with the drop between bars and spans the full width above 3 steps; rows lists the steps and fits long names in half the width',
  },
  steps: { ...STEPS, description: `People funnels only. ${STEPS.description}` },
  events: events(
    0,
    8,
    'Events funnel steps (2 to 8), trend series (1 to 5), the one distribution event, or the cohort start event then up to 7 later events',
  ),
  filters: { ...PROPERTY_FILTERS, description: 'Property filters every event must match' },
  bucket: {
    ...BUCKET,
    description: 'Trends: day (default), week or month. Cohorts: the row size, week by default',
  },
  property: {
    type: 'string',
    pattern: PROP_KEY.source,
    description:
      'Distributions: the numeric property. Cohorts: the YYYY-MM-DD property naming the cohort, cohort by default',
  },
  binSize: {
    type: 'number',
    exclusiveMinimum: 0,
    maximum: 1_000_000_000,
    description: 'Distributions only: the width of a bar, 1 by default',
  },
};

const HEX_ID = '^[a-f0-9]{24}$';

const PLACEMENT = {
  view: {
    type: ['string', 'null'],
    pattern: HEX_ID,
    description:
      'The id of a view, from list_insights or set_views. Omit to keep the stored view, null to clear it. A card without a view shows in the first view',
  },
  section: {
    type: ['string', 'null'],
    pattern: HEX_ID,
    description:
      'The id of a section of the view, from list_insights or set_views. Omit to keep the stored section, null to clear it. A card without a section sits above the sections',
  },
  hidden: {
    type: ['boolean', 'null'],
    description:
      'Hide the card from the dashboard. Omit to keep the stored value, null to clear it',
  },
  width: {
    type: ['string', 'null'],
    enum: [...Object.values(WebAnalyticsInsightWidth), null],
    description:
      'half or full width. Omit to keep the stored value, null to clear it. The default is automatic by type',
  },
};

const INSIGHT = {
  ...CHART,
  type: {
    type: 'string',
    enum: Object.values(WebAnalyticsInsightType),
    description:
      'tabs makes one card that holds 2 to 6 full chart configs in tabs, each tab title is the tab label',
  },
  ...PLACEMENT,
  tabs: {
    type: 'array',
    minItems: 2,
    maxItems: MAX_WEB_ANALYTICS_INSIGHT_TABS,
    items: object(CHART, ['type', 'title']),
    description:
      'Tabs cards only: 2 to 6 full chart configs, never tabs or placement. The title of a tab is its label, and the card title is the title of the insight',
  },
};

const VIEW_ID = { type: 'string', pattern: HEX_ID };

const READ_ONLY = { readOnlyHint: true };

const formatJson = (value: unknown): string =>
  JSON.stringify(value, (_key, item: unknown) =>
    typeof item === 'number' && !Number.isInteger(item) ? Math.round(item * 10) / 10 : item,
  );

const percent = (part: number, whole: number): number | null =>
  whole ? (part / whole) * 100 : null;

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

const validationMessages = (errors: ValidationError[], path = ''): string[] =>
  errors.flatMap((error) => {
    const at = path ? `${path}.${error.property}` : error.property;
    return [
      ...Object.values(error.constraints ?? {}).map((message) =>
        message.replace(error.property, at),
      ),
      ...validationMessages(error.children ?? [], at),
    ];
  });

@Injectable()
export class McpToolsService {
  private readonly tools: McpTool[] = [
    this.tool({
      name: 'describe',
      title: 'Describe web analytics',
      description:
        'Start here. Lists the domains this key reaches with their site origins, goals, saved insight count and plan retention, and for each site the custom event names with counts and property keys in the range.',
      action: Action.Read,
      args: McpDescribeArgs,
      inputSchema: object({
        clusterId: { ...CLUSTER_ID, description: 'Only this domain' },
        days: DAYS,
      }),
      run: (args, context) => this.describe(args, context),
    }),
    this.tool({
      name: 'overview',
      title: 'Traffic overview',
      description:
        'Visits, people, pageviews, sessions, bounce rate, session length and conversion with the previous period, visits over time, and the top 5 of every breakdown.',
      action: Action.Read,
      args: McpRangeArgs,
      inputSchema: object({ clusterId: CLUSTER_ID, days: DAYS, tz: TZ, filter: FILTER }, [
        'clusterId',
      ]),
      run: (args, context) => this.overview(args, context),
    }),
    this.tool({
      name: 'breakdown',
      title: 'Breakdown',
      description:
        'Visits and events by one dimension, most visits first. sources, campaigns and contents show which link brought visitors: filter by source:reddit and break down by campaigns for subreddits or contents for posts.',
      action: Action.Read,
      args: McpBreakdownArgs,
      inputSchema: object(
        {
          clusterId: CLUSTER_ID,
          dimension: { type: 'string', enum: [...WEB_ANALYTICS_BREAKDOWNS] },
          days: DAYS,
          tz: TZ,
          filter: FILTER,
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
        },
        ['clusterId', 'dimension'],
      ),
      run: (args, context) => this.breakdown(args, context),
    }),
    this.tool({
      name: 'person_funnel',
      title: 'Person funnel',
      description:
        'How many visitors or signed-in users went through pages and goals in order. Anonymous visitor ids change every day, so use events_funnel for events without a person.',
      action: Action.Read,
      args: McpPersonFunnelArgs,
      inputSchema: object(
        { clusterId: CLUSTER_ID, steps: STEPS, days: DAYS, tz: TZ, filter: FILTER },
        ['clusterId', 'steps'],
      ),
      run: (args, context) => this.personFunnel(args, context),
    }),
    this.tool({
      name: 'events_funnel',
      title: 'Events funnel',
      description:
        'Counts the events of each step, with conversion from the first step and drop-off from the step before. Fits markers sent once per install, such as a first_open to first_merge journey.',
      action: Action.Read,
      args: McpEventsFunnelArgs,
      inputSchema: object(
        {
          clusterId: CLUSTER_ID,
          events: events(2, 8, 'The steps in order'),
          filters: { ...PROPERTY_FILTERS, description: 'Filters every step must match' },
          days: DAYS,
          tz: TZ,
        },
        ['clusterId', 'events'],
      ),
      run: (args, context) => this.runAs(WebAnalyticsInsightType.Funnel, args, context),
    }),
    this.tool({
      name: 'trend',
      title: 'Event trend',
      description:
        'Event counts per day, week or month for up to 5 series. Daily, weekly and monthly active counts come from markers sent once per period.',
      action: Action.Read,
      args: McpTrendArgs,
      inputSchema: object(
        {
          clusterId: CLUSTER_ID,
          events: events(1, 5, 'One series per event'),
          filters: { ...PROPERTY_FILTERS, description: 'Filters every series must match' },
          bucket: { ...BUCKET, default: 'day' },
          days: DAYS,
          tz: TZ,
        },
        ['clusterId', 'events'],
      ),
      run: (args, context) => this.runAs(WebAnalyticsInsightType.Trend, args, context),
    }),
    this.tool({
      name: 'distribution',
      title: 'Property distribution',
      description:
        'A histogram of a numeric event property with count, mean and median, such as active_days of a monthly marker for an L30 chart.',
      action: Action.Read,
      args: McpDistributionArgs,
      inputSchema: object(
        {
          clusterId: CLUSTER_ID,
          events: events(1, 1, 'The one event that carries the property'),
          property: INSIGHT.property,
          binSize: INSIGHT.binSize,
          filters: PROPERTY_FILTERS,
          days: DAYS,
          tz: TZ,
        },
        ['clusterId', 'events', 'property'],
      ),
      run: (args, context) => this.runAs(WebAnalyticsInsightType.Distribution, args, context),
    }),
    this.tool({
      name: 'cohort_table',
      title: 'Cohort table',
      description:
        'Rows are cohorts from a YYYY-MM-DD event property, newest first. counts holds the start event then each later event; shares are percents of the start event. filling marks counts that can still grow, because the cohort is younger than lagDays, the days from the cohort date that hold 95% of each event: do not compare those.',
      action: Action.Read,
      args: McpCohortTableArgs,
      inputSchema: object(
        {
          clusterId: CLUSTER_ID,
          events: events(2, 8, 'The start event, then the later events'),
          property: { ...INSIGHT.property, default: 'cohort' },
          bucket: { ...BUCKET, default: 'week' },
          filters: PROPERTY_FILTERS,
          days: DAYS,
          tz: TZ,
        },
        ['clusterId', 'events'],
      ),
      run: (args, context) => this.runAs(WebAnalyticsInsightType.Cohorts, args, context),
    }),
    this.tool({
      name: 'retention',
      title: 'Signed-in retention',
      description:
        'Retention of signed-in users by first day, daily and monthly active users, and comebacks after a gap. Only events with a user id count.',
      action: Action.Read,
      args: McpRetentionArgs,
      inputSchema: object({ clusterId: CLUSTER_ID, days: DAYS, tz: TZ }, ['clusterId']),
      run: (args, context) => this.retention(args, context),
    }),
    this.tool({
      name: 'list_insights',
      title: 'List saved insights',
      description:
        'The dashboard views with their sections, and the saved insight cards in order with their full config and placement (view, section, hidden, width).',
      action: Action.Read,
      args: McpClusterArgs,
      inputSchema: object({ clusterId: CLUSTER_ID }, ['clusterId']),
      run: (args, context) => this.insights.readLayout(this.cluster(context, args.clusterId).id),
    }),
    this.tool({
      name: 'run_insight',
      title: 'Run a saved insight',
      description:
        'The current result of one saved insight card. A tabs card returns the result of each tab.',
      action: Action.Read,
      args: McpRunInsightArgs,
      inputSchema: object({ clusterId: CLUSTER_ID, insightId: INSIGHT_ID, tz: TZ }, [
        'clusterId',
        'insightId',
      ]),
      run: async (args, context) => {
        const cluster = this.cluster(context, args.clusterId);
        const insight = await this.insights.readInsightOrThrow(cluster.id, args.insightId);
        const result = async (
          config: WebAnalyticsInsightConfig,
        ): Promise<Record<string, unknown>> =>
          this.formatResult(
            await this.insights.run(cluster.id, config, args.tz, cluster.retentionDays),
            args.tz,
          );
        return {
          id: insight.id,
          title: insight.title,
          ...(insight.type === WebAnalyticsInsightType.Tabs
            ? {
                tabs: await Promise.all(
                  (insight.tabs ?? []).map(async (tab) => ({
                    title: tab.title,
                    ...(await result(tab)),
                  })),
                ),
              }
            : await result(insight)),
        };
      },
    }),
    this.tool({
      name: 'create_insight',
      title: 'Save an insight',
      description: `Adds an insight card to the end of the dashboard, up to ${MAX_WEB_ANALYTICS_INSIGHTS} per domain. Try it with the matching read tool first. Pass view, section, hidden and width to place it, with view and section ids from list_insights or set_views.`,
      action: Action.Write,
      args: McpCreateInsightArgs,
      inputSchema: object({ clusterId: CLUSTER_ID, ...INSIGHT }, ['clusterId', 'type', 'title']),
      annotations: { readOnlyHint: false },
      run: async (args, context) => {
        const { clusterId, ...body } = args;
        return this.write.createInsight(
          this.cluster(context, clusterId).id,
          normalizeWebAnalyticsInsight(body),
          context.user.id,
        );
      },
    }),
    this.tool({
      name: 'update_insight',
      title: 'Change a saved insight',
      description:
        'Replaces the whole config of a saved insight card. The placement fields (view, section, hidden, width) keep their stored value when omitted, and null clears one.',
      action: Action.Write,
      args: McpUpdateInsightArgs,
      inputSchema: object({ clusterId: CLUSTER_ID, insightId: INSIGHT_ID, ...INSIGHT }, [
        'clusterId',
        'insightId',
        'type',
        'title',
      ]),
      annotations: { readOnlyHint: false, idempotentHint: true },
      run: async (args, context) => {
        const { clusterId, insightId, ...body } = args;
        return this.write.updateInsight(
          this.cluster(context, clusterId).id,
          insightId,
          normalizeWebAnalyticsInsight(body),
          context.user.id,
        );
      },
    }),
    this.tool({
      name: 'reorder_insights',
      title: 'Reorder saved insights',
      description:
        'Sets the card order and/or where cards sit (view, section, hidden, width) in one call. ids, when given, must list every saved insight of the domain once. placements change only the cards they list, and a placement field keeps its stored value when omitted while null clears it. Use it to lay out a whole dashboard.',
      action: Action.Write,
      args: McpReorderInsightsArgs,
      inputSchema: object(
        {
          clusterId: CLUSTER_ID,
          ids: {
            type: 'array',
            maxItems: MAX_WEB_ANALYTICS_INSIGHTS,
            uniqueItems: true,
            items: INSIGHT_ID,
          },
          placements: {
            type: 'array',
            maxItems: MAX_WEB_ANALYTICS_INSIGHTS,
            items: object({ id: INSIGHT_ID, ...PLACEMENT }, ['id']),
          },
        },
        ['clusterId'],
      ),
      annotations: { readOnlyHint: false, idempotentHint: true },
      run: (args, context) =>
        this.write.reorderInsights(this.cluster(context, args.clusterId).id, args, context.user.id),
    }),
    this.tool({
      name: 'set_views',
      title: 'Set dashboard views',
      description:
        'Replaces the views of the dashboard, the first one is the default. Pass the id of an existing view or section to keep or rename it, and omit it to add one. A view with traffic true shows the built-in traffic cards, and no view shows them unless it says so. Cards of a removed view or section move to the first view or out of the section. Returns the views and insights, so the new ids can be used right away.',
      action: Action.Write,
      args: McpSetViewsArgs,
      inputSchema: object(
        {
          clusterId: CLUSTER_ID,
          views: {
            type: 'array',
            maxItems: MAX_WEB_ANALYTICS_VIEWS,
            items: object(
              {
                id: { ...VIEW_ID, description: 'From list_insights, to keep or rename a view' },
                name: { type: 'string', minLength: 1, maxLength: 40 },
                traffic: { type: 'boolean', default: false },
                sections: {
                  type: 'array',
                  maxItems: MAX_WEB_ANALYTICS_SECTIONS,
                  items: object(
                    {
                      id: { ...VIEW_ID, description: 'From list_insights, to keep or rename it' },
                      title: { type: 'string', minLength: 1, maxLength: 60 },
                      collapsed: { type: 'boolean', default: false },
                    },
                    ['title'],
                  ),
                },
              },
              ['name'],
            ),
          },
        },
        ['clusterId', 'views'],
      ),
      annotations: { readOnlyHint: false, idempotentHint: true },
      run: (args, context) =>
        this.write.updateViews(
          this.cluster(context, args.clusterId).id,
          args.views,
          context.user.id,
        ),
    }),
    this.tool({
      name: 'delete_insight',
      title: 'Remove a saved insight',
      description: 'Removes an insight card from the dashboard.',
      action: Action.Write,
      args: McpInsightIdArgs,
      inputSchema: object({ clusterId: CLUSTER_ID, insightId: INSIGHT_ID }, [
        'clusterId',
        'insightId',
      ]),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
      run: async (args, context) => {
        await this.write.deleteInsight(
          this.cluster(context, args.clusterId).id,
          args.insightId,
          context.user.id,
        );
        return { deleted: args.insightId };
      },
    }),
  ];

  constructor(
    private readonly clusters: ClusterReadService,
    private readonly read: WebAnalyticsReadService,
    private readonly insights: WebAnalyticsInsightReadService,
    private readonly write: WebAnalyticsWriteService,
  ) {}

  public list(user: RequestUser): McpToolDefinition[] {
    return this.tools
      .filter((tool) => this.allows(user, tool.action))
      .map(({ name, title, description, inputSchema, annotations }) => ({
        name,
        title,
        description,
        inputSchema,
        annotations,
      }));
  }

  public async call(
    user: RequestUser,
    name: string,
    plain: unknown,
  ): Promise<McpToolContent | null> {
    const tool = this.tools.find((candidate) => candidate.name === name);
    if (!tool) return null;
    if (!this.allows(user, tool.action))
      return this.error(`This key lacks the ${Resource.WebAnalytics}:${tool.action} scope`);
    try {
      const result = await tool.call(plain ?? {}, { user, reach: await this.reach(user) });
      return { content: [{ type: 'text', text: formatJson(result) }] };
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() < 500)
        return this.error(error.message);
      throw error;
    }
  }

  private tool<T extends object>(
    definition: Omit<McpTool, 'call' | 'annotations'> & {
      args: ClassConstructor<T>;
      annotations?: McpToolDefinition['annotations'];
      run: (args: T, context: McpContext) => Promise<unknown>;
    },
  ): McpTool {
    const { args, run, annotations = READ_ONLY, ...rest } = definition;
    return {
      ...rest,
      annotations,
      call: async (plain, context) => {
        if (typeof plain !== 'object' || Array.isArray(plain) || plain === null)
          throw new BadRequestException('Invalid arguments: pass an object');
        const instance = plainToInstance(args, plain);
        const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
        if (errors.length)
          throw new BadRequestException(
            `Invalid arguments: ${validationMessages(errors).join('; ')}`,
          );
        return run(instance, context);
      },
    };
  }

  private allows(user: RequestUser, action: Action): boolean {
    const held =
      user.scopes?.find((scope) => scope.resource === Resource.WebAnalytics)?.action ?? Action.None;
    return ACTION_RANK[held] >= ACTION_RANK[action];
  }

  private async reach(user: RequestUser): Promise<ClusterNormalized[]> {
    const access = user.access ?? { kind: 'all' };
    if (access.kind === 'projects') return [];
    const clusters = await this.clusters.readWhereUserHasAnyRole(user.id);
    return access.kind === 'all'
      ? clusters
      : clusters.filter((cluster) => access.ids.includes(cluster.id));
  }

  private cluster(context: McpContext, clusterId: string): McpCluster {
    const cluster = context.reach.find((candidate) => candidate.id === clusterId);
    if (!cluster) throw new ForbiddenException('This key does not reach that domain');
    return { id: cluster.id, retentionDays: this.retentionDays(cluster) };
  }

  private retentionDays(cluster: ClusterNormalized): number {
    return getClusterPlanConfig(cluster.tier).webAnalytics.retentionDays;
  }

  private range(
    args: { days: number; tz: string; filter?: string[] },
    granularity: WebAnalyticsGranularity = WebAnalyticsGranularity.Day,
  ): ReadWebAnalyticsQuery {
    const to = new Date();
    return {
      from: new Date(to.getTime() - args.days * DAY_MS),
      to,
      granularity,
      filter: args.filter ?? [],
      tz: args.tz,
      compare: false,
    };
  }

  private date(time: number | string, tz: string): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(time));
  }

  private async describe(args: McpDescribeArgs, context: McpContext): Promise<unknown> {
    if (args.clusterId) this.cluster(context, args.clusterId);
    const clusters = context.reach.filter(
      (cluster) => !args.clusterId || cluster.id === args.clusterId,
    );
    return {
      days: args.days,
      domains: await Promise.all(
        clusters.map(async (cluster) => {
          const retentionDays = this.retentionDays(cluster);
          const site = await this.read.readSiteByClusterId(cluster.id);
          if (!site)
            return { clusterId: cluster.id, name: cluster.name, retentionDays, site: null };
          const [layout, schema] = await Promise.all([
            this.insights.readLayout(cluster.id),
            this.insights.readSchema(cluster.id, args.days, retentionDays),
          ]);
          return {
            clusterId: cluster.id,
            name: cluster.name,
            retentionDays,
            site: {
              origins: site.origins,
              goals: site.goals,
              insights: layout.insights.length,
              views: layout.views.length,
            },
            events: schema.events.slice(0, 50),
          };
        }),
      ),
    };
  }

  private async overview(args: McpRangeArgs, context: McpContext): Promise<unknown> {
    const cluster = this.cluster(context, args.clusterId);
    const granularity =
      args.days <= 31
        ? WebAnalyticsGranularity.Day
        : args.days <= 180
          ? WebAnalyticsGranularity.Week
          : WebAnalyticsGranularity.Month;
    const report = await this.read.readReport(
      cluster.id,
      this.range(args, granularity),
      cluster.retentionDays,
    );
    return {
      from: this.date(report.from, args.tz),
      to: this.date(report.to, args.tz),
      summary: report.summary,
      previous: report.previous,
      online: report.online,
      series: report.series.map((point) => ({
        [granularity]: this.date(point.time, args.tz),
        visitors: point.visitors,
        pageviews: point.pageviews,
      })),
      top: Object.fromEntries(
        WEB_ANALYTICS_BREAKDOWNS.map((name) => [
          name,
          report.breakdowns[name]
            .slice(0, 5)
            .map((row) => ({ name: row.name, visitors: row.visitors })),
        ]),
      ),
    };
  }

  private async breakdown(args: McpBreakdownArgs, context: McpContext): Promise<unknown> {
    const cluster = this.cluster(context, args.clusterId);
    const rows = await this.read.readBreakdown(
      cluster.id,
      this.range(args),
      args.dimension,
      cluster.retentionDays,
    );
    return { dimension: args.dimension, rows: rows.slice(0, args.limit), total: rows.length };
  }

  private async personFunnel(args: McpPersonFunnelArgs, context: McpContext): Promise<unknown> {
    const cluster = this.cluster(context, args.clusterId);
    const funnel = await this.read.readFunnel(
      cluster.id,
      { ...this.range(args), step: args.steps },
      cluster.retentionDays,
    );
    return {
      steps: this.funnelSteps(
        funnel.steps.map((step) => ({ name: step.step, count: step.visitors })),
      ),
    };
  }

  private async retention(args: McpRetentionArgs, context: McpContext): Promise<unknown> {
    const cluster = this.cluster(context, args.clusterId);
    return this.read.readRetention(cluster.id, this.range(args), cluster.retentionDays);
  }

  private async runAs(
    type: WebAnalyticsInsightType,
    args: McpClusterArgs & { tz: string } & Partial<WebAnalyticsInsightBody>,
    context: McpContext,
  ): Promise<unknown> {
    const { clusterId, tz, ...body } = args;
    const cluster = this.cluster(context, clusterId);
    const insight = normalizeWebAnalyticsInsight({
      ...body,
      type,
      title: type,
    } as WebAnalyticsInsightBody);
    return this.formatResult(
      await this.insights.run(cluster.id, insight, tz, cluster.retentionDays),
      tz,
    );
  }

  private formatResult(result: WebAnalyticsInsightResult, tz: string): Record<string, unknown> {
    return {
      ...result,
      from: this.date(result.from, tz),
      to: this.date(result.to, tz),
      steps: result.steps && this.funnelSteps(result.steps),
      times: result.times?.map((time) => this.date(time, tz)),
      series: result.series?.map((series) => ({ ...series, total: sum(series.counts) })),
    };
  }

  private funnelSteps(steps: WebAnalyticsInsightStep[]): unknown[] {
    return steps.map((step, index) => ({
      ...step,
      conversion: percent(step.count, steps[0].count),
      dropOff: index ? percent(steps[index - 1].count - step.count, steps[index - 1].count) : null,
    }));
  }

  private error(text: string): McpToolContent {
    return { content: [{ type: 'text', text }], isError: true };
  }
}
