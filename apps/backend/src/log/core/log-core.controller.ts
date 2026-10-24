import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
  UseInterceptors,
  MessageEvent,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiResponseProperty,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Observable, concat, from, map } from 'rxjs';
import { subHours } from 'date-fns';
import { Public } from '../../auth/core/decorators/is-public';
import { RequireScope } from '../../auth/core/decorators/require-scope.decorator';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';
import { Action } from '../../personal-api-key/core/enums/action.enum';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { SuccessResponse } from '../../shared/responses/success.response';
import { LogCreatedEvent } from '../events/definitions/log-created.event';
import { LogEventEmitter } from '../events/log-event.emitter';
import { LogEvents } from '../events/log-events.enum';
import { LogQueueingService } from '../queueing/log-queueing.service';
import { LogRateLimitService } from '../rate-limit/log-rate-limit.service';
import { LogReadService } from '../read/log-read.service';
import { DemoEndpoint } from '../../demo/decorators/demo-endpoint.decorator';
import { CreateLogBody } from './dto/create-log.body';
import { CreateLogsBatchBody } from './dto/create-logs-batch.body';
import { ReadLogsQuery } from './dto/read-newer-than.query';
import { StreamProjectLogsQuery } from './dto/stream-project-logs.query';
import {
  AppsFilterQuery,
  ClusterLogAnalyticsQuery,
  ReadClusterLogsQuery,
} from './dto/cluster-logs.query';
import {
  ClusterLogSerialized,
  LogClickhouseNormalized,
  LogClickhouseSerialized,
} from './entities/log.interface';
import { LogSerializer } from './entities/log.serializer';
import { LogReadDirection } from './enums/log-read-direction.enum';
import { DemoCacheInterceptor } from '../../demo/interceptors/demo-cache.interceptor';
import { LogAnalyticsService } from '../analytics/log-analytics.service';
import { LogAnalyticsQuery } from '../analytics/dto/log-analytics-query.dto';
import { LogAnalyticsResponse } from '../analytics/dto/log-analytics-response.dto';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { ProjectReadService } from '../../project/read/project-read.service';
import { ProjectNormalized } from '../../project/core/entities/project.interface';
import { IngestProjectService } from '../../project/ingest/ingest-project.service';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { projectTierFromClusterTier } from '../../cluster/core/enums/cluster-tier.enum';
import { NamespaceMetadata } from '../read/dto/namespace-metadata.dto';
import { KeyedEventStream } from '../../shared/utils/keyed-event-stream';

type AppScope = {
  projectIds: string[];
  appNames: Map<string, string>;
  retentionHours: number;
};

@Controller('')
@ApiTags('Logs')
export class LogCoreController {
  private readonly logStream = new KeyedEventStream<LogCreatedEvent>(
    this.eventEmitter,
    LogEvents.LogCreatedEvent,
    (event) => event.projectId,
  );

  private readonly clusterLogStream = new KeyedEventStream<LogCreatedEvent>(
    this.eventEmitter,
    LogEvents.LogCreatedEvent,
    (event) => event.clusterId,
  );

  constructor(
    private readonly logReadService: LogReadService,
    private readonly logQueueingService: LogQueueingService,
    private readonly ingestProjectService: IngestProjectService,
    private readonly logEventEmitter: LogEventEmitter,
    private readonly eventEmitter: EventEmitter2,
    private readonly logRateLimitService: LogRateLimitService,
    private readonly logAnalyticsService: LogAnalyticsService,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly projectReadService: ProjectReadService,
    private readonly clusterReadCachedService: ClusterReadCachedService,
  ) {}

  @Public()
  @Post('logs')
  @ApiSecurity('project-api-key')
  @ApiResponseProperty({ type: SuccessResponse })
  public async create(
    @Body() dto: CreateLogBody,
    @Headers('project-api-key') apiKeyValue: string,
  ): Promise<SuccessResponse> {
    const project = await this.ingestProjectService.resolve(apiKeyValue, dto.app);

    await this.logRateLimitService.requireWithinLimit(project.id);

    this.queueLog(project, dto);

    return new SuccessResponse();
  }

  @Public()
  @Post('logs/batch')
  @ApiSecurity('project-api-key')
  @ApiResponseProperty({ type: SuccessResponse })
  public async createBatch(
    @Body() dto: CreateLogsBatchBody,
    @Headers('project-api-key') apiKeyValue: string,
  ): Promise<SuccessResponse> {
    const projectByApp = new Map<string | undefined, ProjectNormalized>();
    const entries: { log: CreateLogBody; project: ProjectNormalized }[] = [];

    for (const log of dto.logs) {
      const project =
        projectByApp.get(log.app) ??
        (await this.ingestProjectService.resolve(apiKeyValue, log.app));

      projectByApp.set(log.app, project);
      entries.push({ log, project });
    }

    const counts = new Map<string, number>();

    for (const { project } of entries) {
      counts.set(project.id, (counts.get(project.id) ?? 0) + 1);
    }

    for (const [projectId, count] of counts) {
      await this.logRateLimitService.requireWithinLimit(projectId, count);
    }

    entries.forEach(({ log, project }) => this.queueLog(project, log));

    return new SuccessResponse();
  }

  @DemoEndpoint()
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @Sse('projects/:projectId/logs/sse')
  public async streamProjectLogs(
    @Query() dto: StreamProjectLogsQuery,
    @Param('projectId') projectId: string,
  ): Promise<Observable<MessageEvent>> {
    const eventStream$ = this.logStream.stream(projectId).pipe(map((data) => ({ data })));

    let historicalLogs$: Observable<{ data: LogClickhouseSerialized }> = from([]);

    if (dto.lastId) {
      const historicalLogs = await this.logReadService.readMany({
        projectIds: [projectId],
        lastId: dto.lastId,
        direction: LogReadDirection.After,
        limit: 100,
      });

      historicalLogs$ = from(historicalLogs).pipe(
        map((log) => ({ data: LogSerializer.serializeClickhouse(log) })),
      );
    }

    return concat(historicalLogs$, eventStream$);
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Logs, Action.Read)
  @ApiBearerAuth()
  @Get('projects/:projectId/logs/v2')
  @ApiResponse({ type: LogClickhouseSerialized, isArray: true })
  public async readLogsV2(
    @Param('projectId') projectId: string,
    @Query() dto: ReadLogsQuery,
  ): Promise<LogClickhouseSerialized[]> {
    this.requireCompletePagination(dto);

    const project = await this.projectReadCachedService.readProjectOrThrow(projectId);
    const retentionHours = getProjectPlanConfig(project.tier).logs.retentionHours;

    const logs = await this.logReadService.readMany({
      ...dto,
      limit: dto.limit ?? 50,
      startDate: this.clampToRetention(dto.startDate, retentionHours),
      projectIds: [projectId],
    });

    return logs.map((log) => LogSerializer.serializeClickhouse(log));
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('projects/:projectId/logs/namespaces')
  @ApiResponse({ type: NamespaceMetadata, isArray: true })
  public async getUniqueNamespaces(
    @Param('projectId') projectId: string,
  ): Promise<NamespaceMetadata[]> {
    return await this.logReadService.getUniqueNamespaces([projectId]);
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('projects/:projectId/logs/analytics/v1')
  @ApiResponse({ type: LogAnalyticsResponse })
  public async getLogAnalytics(
    @Param('projectId') projectId: string,
    @Query() dto: LogAnalyticsQuery,
  ): Promise<LogAnalyticsResponse> {
    const project = await this.projectReadCachedService.readProjectOrThrow(projectId);

    this.clampAnalyticsRange(dto, getProjectPlanConfig(project.tier).logs.retentionHours);

    return await this.logAnalyticsService.getBucketedAnalytics([projectId], dto);
  }

  @DemoEndpoint()
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Logs, Action.Read)
  @Sse('clusters/:clusterId/logs/sse')
  public async streamClusterLogs(
    @Query() dto: StreamProjectLogsQuery,
    @Param('clusterId') clusterId: string,
  ): Promise<Observable<MessageEvent>> {
    const eventStream$ = this.clusterLogStream.stream(clusterId).pipe(map((data) => ({ data })));

    let historicalLogs$: Observable<{ data: ClusterLogSerialized }> = from([]);

    if (dto.lastId) {
      const scope = await this.readAppScope(clusterId);
      const historicalLogs = await this.logReadService.readMany({
        projectIds: scope.projectIds,
        lastId: dto.lastId,
        direction: LogReadDirection.After,
        limit: 100,
      });

      historicalLogs$ = from(historicalLogs).pipe(
        map((log) => ({ data: this.serializeClusterLog(log, scope) })),
      );
    }

    return concat(historicalLogs$, eventStream$);
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Logs, Action.Read)
  @ApiBearerAuth()
  @Get('clusters/:clusterId/logs')
  @ApiResponse({ type: ClusterLogSerialized, isArray: true })
  public async readClusterLogs(
    @Param('clusterId') clusterId: string,
    @Query() dto: ReadClusterLogsQuery,
  ): Promise<ClusterLogSerialized[]> {
    this.requireCompletePagination(dto);

    const scope = await this.readAppScope(clusterId, dto.apps);

    const logs = await this.logReadService.readMany({
      ...dto,
      limit: dto.limit ?? 50,
      startDate: this.clampToRetention(dto.startDate, scope.retentionHours),
      projectIds: scope.projectIds,
    });

    return logs.map((log) => this.serializeClusterLog(log, scope));
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Logs, Action.Read)
  @ApiBearerAuth()
  @Get('clusters/:clusterId/logs/namespaces')
  @ApiResponse({ type: NamespaceMetadata, isArray: true })
  public async getClusterNamespaces(
    @Param('clusterId') clusterId: string,
    @Query() dto: AppsFilterQuery,
  ): Promise<NamespaceMetadata[]> {
    const scope = await this.readAppScope(clusterId, dto.apps);

    return await this.logReadService.getUniqueNamespaces(scope.projectIds);
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Logs, Action.Read)
  @ApiBearerAuth()
  @Get('clusters/:clusterId/logs/analytics')
  @ApiResponse({ type: LogAnalyticsResponse })
  public async getClusterLogAnalytics(
    @Param('clusterId') clusterId: string,
    @Query() dto: ClusterLogAnalyticsQuery,
  ): Promise<LogAnalyticsResponse> {
    const scope = await this.readAppScope(clusterId, dto.apps);

    this.clampAnalyticsRange(dto, scope.retentionHours);

    return await this.logAnalyticsService.getBucketedAnalytics(scope.projectIds, dto);
  }

  private queueLog(project: ProjectNormalized, log: CreateLogBody): void {
    const result = this.logQueueingService.queueLog({
      createdAt: new Date(log.createdAt),
      message: log.message,
      level: log.level,
      sequenceNumber: log.sequenceNumber,
      namespace: log.namespace,
      projectId: project.id,
    });

    this.logEventEmitter.emitLogCreatedEvent({
      id: result.id,
      createdAt: log.createdAt,
      projectId: project.id,
      clusterId: project.clusterId,
      app: project.name,
      level: log.level,
      message: log.message,
      sequenceNumber: log.sequenceNumber,
      namespace: log.namespace,
    });
  }

  private async readAppScope(clusterId: string, apps?: string[]): Promise<AppScope> {
    const [projects, clusterTier] = await Promise.all([
      this.projectReadService.readByClusterId(clusterId),
      this.clusterReadCachedService.readTier(clusterId),
    ]);
    const selected = apps?.length
      ? projects.filter((project) => apps.includes(project.name))
      : projects;
    const tiers = [projectTierFromClusterTier(clusterTier), ...projects.map(({ tier }) => tier)];

    return {
      projectIds: selected.map((project) => project.id),
      appNames: new Map(projects.map((project) => [project.id, project.name])),
      retentionHours: Math.max(
        ...tiers.map((tier) => getProjectPlanConfig(tier).logs.retentionHours),
      ),
    };
  }

  private serializeClusterLog(log: LogClickhouseNormalized, scope: AppScope): ClusterLogSerialized {
    return {
      ...LogSerializer.serializeClickhouse(log),
      app: scope.appNames.get(log.projectId) ?? '',
    };
  }

  private requireCompletePagination(dto: ReadLogsQuery): void {
    if ((dto.lastId && !dto.direction) || (!dto.lastId && dto.direction)) {
      throw new BadRequestException('If using pagination, provide both lastId and direction');
    }
  }

  private clampToRetention(startDate: Date | undefined, retentionHours: number): Date {
    const cutOffDate = subHours(new Date(), retentionHours);

    return startDate && startDate > cutOffDate ? startDate : cutOffDate;
  }

  private clampAnalyticsRange(dto: LogAnalyticsQuery, retentionHours: number): void {
    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const now = new Date();

    dto.startDate = this.clampToRetention(dto.startDate, retentionHours);
    dto.endDate = dto.endDate > now ? now : dto.endDate;
  }
}
