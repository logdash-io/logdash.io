import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireScope } from '../../auth/core/decorators/require-scope.decorator';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { Action } from '../../personal-api-key/core/enums/action.enum';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';
import { HttpPingBucketAggregationService } from '../aggregation/http-ping-bucket-aggregation.service';
import { GetBucketsQuery } from './dto/get_buckets.query';
import { PeriodsGranularity } from './types/bucket-period.enum';
import { BucketsResponse } from './types/buckets.response';

@ApiBearerAuth()
@ApiTags('HTTP Ping Buckets')
@Controller()
@UseGuards(ClusterMemberGuard)
export class HttpPingBucketCoreController {
  constructor(private readonly httpPingBucketAggregateService: HttpPingBucketAggregationService) {}

  @RequireScope(Resource.Monitors, Action.Read)
  @Get('monitors/:httpMonitorId/http_ping_buckets')
  @ApiResponse({ type: BucketsResponse })
  async findBucketsByMonitorId(
    @Param('httpMonitorId') monitorId: string,
    @Query() query: GetBucketsQuery,
  ): Promise<BucketsResponse> {
    const buckets = await this.httpPingBucketAggregateService.getBucketsForMonitor(
      monitorId,
      query.period,
    );

    return { buckets, granularity: PeriodsGranularity[query.period] };
  }
}
