import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Put,
  Sse,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from '../../auth/core/decorators/is-public';
import { ApiBearerAuth, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MetricReadService } from '../read/metric-read.service';
import { MetricSerialized, SimpleMetric } from './entities/metric.normalized';
import { SuccessResponse } from '../../shared/responses/success.response';
import { RecordMetricBody } from './dto/record-metric.dto';
import { MetricQueueingService } from '../queueing/metric-queueing-service';
import { MetricSerializer } from './entities/metric.serializer';
import { ApiKeyReadCachedService } from '../../api-key/read/api-key-read-cached.service';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { MetricEvents } from '../events/metric-events.enum';
import { MetricCreatedEvent } from '../events/definitions/metric-created.event';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { DemoEndpoint } from '../../demo/decorators/demo-endpoint.decorator';
import { DemoCacheInterceptor } from '../../demo/interceptors/demo-cache.interceptor';

@Controller('')
@ApiTags('Metrics')
export class MetricCoreController {
  constructor(
    private readonly metricQueueingService: MetricQueueingService,
    private readonly metricReadService: MetricReadService,
    private readonly apiKeyReadCachedService: ApiKeyReadCachedService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Public()
  @Put('metrics')
  @ApiSecurity('project-api-key')
  @ApiResponse({ type: SuccessResponse })
  public async recordMetric(
    @Body() dto: RecordMetricBody,
    @Headers('project-api-key') apiKeyValue: string,
  ): Promise<SuccessResponse> {
    const projectId = await this.apiKeyReadCachedService.readProjectId(apiKeyValue);

    if (!projectId) {
      throw new UnauthorizedException('Invalid API key');
    }

    await this.metricQueueingService.queueMetric({
      ...dto,
      projectId,
    });

    return new SuccessResponse();
  }

  @DemoEndpoint()
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Sse('projects/:projectId/metrics/sse')
  public async streamProjectMetrics(
    @Param('projectId') projectId: string,
  ): Promise<Observable<any>> {
    const eventStream$ = fromEvent(this.eventEmitter, MetricEvents.MetricCreatedEvent).pipe(
      filter(
        (data: MetricCreatedEvent) =>
          data.projectId === projectId && data.granularity !== MetricGranularity.AllTime,
      ),
      map((data: MetricCreatedEvent) => ({ data })),
    );

    return new Observable((observer) => {
      const subscription = eventStream$.subscribe(observer);

      return () => {
        subscription.unsubscribe();
      };
    });
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('projects/:projectId/metrics/:metricRegisterEntryId')
  @ApiResponse({ type: MetricSerialized, isArray: true })
  public async readBelongingToProject(
    @Param('projectId') projectId: string,
    @Param('metricRegisterEntryId') metricRegisterEntryId: string,
  ): Promise<MetricSerialized[]> {
    const metricRegisterEntry =
      await this.metricRegisterReadService.readById(metricRegisterEntryId);

    if (!metricRegisterEntry) {
      throw new NotFoundException('Metric register entry not found');
    }

    if (metricRegisterEntry.projectId !== projectId) {
      throw new ForbiddenException('Metric register entry does not belong to this project');
    }

    const metrics = await this.metricReadService.readByMetricRegisterEntryId(metricRegisterEntryId);

    return MetricSerializer.serializeMany(metrics, [metricRegisterEntry]);
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('projects/:projectId/metrics')
  @ApiResponse({ type: SimpleMetric, isArray: true })
  public async readCurrentMetrics(@Param('projectId') projectId: string): Promise<SimpleMetric[]> {
    const metricRegisterEntries =
      await this.metricRegisterReadService.readBelongingToProject(projectId);

    const registerEntryIds = metricRegisterEntries.map((entry) => entry.id);

    const baselineValues = await this.metricReadService.readBaselineValues({
      metricRegisterEntryIds: registerEntryIds,
    });

    return metricRegisterEntries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      value: baselineValues[entry.id] || 0,
      metricRegisterEntryId: entry.id,
    }));
  }
}
