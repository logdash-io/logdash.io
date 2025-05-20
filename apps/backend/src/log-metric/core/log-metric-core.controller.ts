import {
  Controller,
  Get,
  Param,
  Query,
  Sse,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogMetricReadService } from '../read/log-metric-read.service';
import { LogMetricSerializer } from './entities/log-metric.serializer';
import { ReadLogMetricsQuery } from './dto/read-log-metrics.query';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogMetricEvents } from '../events/log-metric-events.enum';
import { LogMetricCreatedEvent } from '../events/definitions/log-metric-created.event';
import { LogMetricsResponse } from './dto/log-metrics.response';
import { MetricGranularity } from '../../metric-shared/enums/metric-granularity.enum';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { DemoCacheInterceptor } from '../../demo/interceptors/demo-cache.interceptor';
import { DemoEndpoint } from '../../demo/decorators/demo-endpoint.decorator';

@Controller('')
@ApiTags('Log metrics')
export class LogMetricCoreController {
  constructor(
    private readonly logMetricsReadService: LogMetricReadService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('projects/:projectId/log_metrics')
  @ApiResponse({ type: LogMetricsResponse })
  public async read(
    @Param('projectId') projectId: string,
    @Query() dto: ReadLogMetricsQuery,
  ): Promise<LogMetricsResponse> {
    const logMetrics = await this.logMetricsReadService.read({
      granularities: dto.granularities,
      before: dto.before ? new Date(dto.before) : undefined,
      after: dto.after ? new Date(dto.after) : undefined,
      projectId,
    });

    return LogMetricSerializer.prepareResponse(logMetrics);
  }

  @DemoEndpoint()
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Sse('projects/:projectId/log_metrics/sse')
  public async streamProjectLogMetrics(
    @Param('projectId') projectId: string,
    @CurrentUserId() userId: string,
  ): Promise<Observable<any>> {
    const eventStream$ = fromEvent(
      this.eventEmitter,
      LogMetricEvents.LogMetricCreatedEvent,
    ).pipe(
      filter(
        (data: LogMetricCreatedEvent) =>
          data.projectId === projectId &&
          data.granularity !== MetricGranularity.AllTime,
      ),
      map((data: any) => ({ data })),
    );

    return new Observable((observer) => {
      const subscription = eventStream$.subscribe(observer);

      return () => {
        subscription.unsubscribe();
      };
    });
  }
}
