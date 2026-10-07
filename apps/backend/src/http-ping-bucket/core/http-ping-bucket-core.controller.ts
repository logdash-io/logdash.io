import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireScope } from '../../auth/core/decorators/require-scope.decorator';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { Action } from '../../personal-api-key/core/enums/action.enum';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';
import { HttpPingBucketAggregationService } from '../aggregation/http-ping-bucket-aggregation.service';
import { GetBucketsQuery } from './dto/get_buckets.query';
import { PeriodsGranularity } from './types/bucket-period.enum';
import { BucketsResponse } from './types/buckets.response';
import { DemoEndpoint } from '../../demo/decorators/demo-endpoint.decorator';
import { DemoCacheInterceptor } from '../../demo/interceptors/demo-cache.interceptor';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';

@ApiBearerAuth()
@ApiTags('HTTP Ping Buckets')
@Controller()
@UseGuards(ClusterMemberGuard)
export class HttpPingBucketCoreController {
  constructor(
    private readonly httpPingBucketAggregateService: HttpPingBucketAggregationService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
  ) {}

  @RequireScope(Resource.Monitors, Action.Read)
  @Get('monitors/:httpMonitorId/http_ping_buckets')
  @ApiResponse({ type: BucketsResponse })
  public async findBucketsByMonitorId(
    @Param('httpMonitorId') monitorId: string,
    @Query() query: GetBucketsQuery,
  ): Promise<BucketsResponse> {
    const buckets = await this.httpPingBucketAggregateService.getBucketsForMonitor(
      monitorId,
      query.period,
    );

    return { buckets, granularity: PeriodsGranularity[query.period] };
  }

  @UseInterceptors(DemoCacheInterceptor)
  @DemoEndpoint()
  @RequireScope(Resource.Monitors, Action.Read)
  @Get('clusters/:clusterId/monitors/:monitorId/http_ping_buckets')
  @ApiResponse({ type: BucketsResponse })
  public async findBucketsByClusterMonitorId(
    @Param('clusterId') clusterId: string,
    @Param('monitorId') monitorId: string,
    @Query() query: GetBucketsQuery,
  ): Promise<BucketsResponse> {
    const monitor = await this.httpMonitorReadService.readById(monitorId);

    if (!monitor || monitor.clusterId !== clusterId) {
      throw new NotFoundException('Monitor not found in this domain');
    }

    return this.findBucketsByMonitorId(monitorId, query);
  }
}
