import { Controller, ForbiddenException, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpPingBucketAggregationService } from '../aggregation/http-ping-bucket-aggregation.service';
import { GetBucketsQuery } from './dto/get_buckets.query';
import { PeriodsGranularity } from './types/bucket-period.enum';
import { BucketsResponse } from './types/buckets.response';
import { ClusterReadService } from '../../cluster/read/cluster-read.service';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { ProjectReadService } from '../../project/read/project-read.service';
import { getProjectPlanConfig } from '../../shared/configs/project-plan-configs';

@ApiBearerAuth()
@ApiTags('HTTP Ping Buckets')
@Controller()
@UseGuards(ClusterMemberGuard)
export class HttpPingBucketCoreController {
  constructor(
    private readonly httpPingBucketAggregateService: HttpPingBucketAggregationService,
    private readonly projectReadService: ProjectReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
  ) {}

  @Get('monitors/:httpMonitorId/http_ping_buckets')
  @ApiResponse({ type: BucketsResponse })
  async findBucketsByMonitorId(
    @Param('httpMonitorId') monitorId: string,
    @Query() query: GetBucketsQuery,
  ): Promise<BucketsResponse> {
    const monitor = await this.httpMonitorReadService.readByIdOrThrow(monitorId);

    const project = await this.projectReadService.readByIdOrThrow(monitor.projectId);

    if (!getProjectPlanConfig(project.tier).httpMonitors.canDisplayBuckets) {
      throw new ForbiddenException('Buckets are not allowed for this project');
    }

    const buckets = await this.httpPingBucketAggregateService.getBucketsForMonitor(
      monitorId,
      query.period,
    );

    return { buckets, granularity: PeriodsGranularity[query.period] };
  }
}
