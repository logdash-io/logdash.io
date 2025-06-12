import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpPingBucketSerialized } from '../../http-ping-bucket/core/entities/http-ping-bucket.interface';
import { HttpPingBucketAggregationService } from '../aggregation/http-ping-bucket-aggregation.service';

@ApiBearerAuth()
@ApiTags('HTTP Ping Buckets')
@Controller()
@UseGuards(ClusterMemberGuard)
export class HttpPingBucketCoreController {
  constructor(private readonly httpPingBucketAggregateService: HttpPingBucketAggregationService) {}

  @Get('monitors/:httpMonitorId/http_ping_buckets')
  @ApiResponse({ type: HttpPingBucketSerialized, isArray: true })
  async findBucketsByMonitorId(
    @Param('httpMonitorId') monitorId: string,
    @Query('period') period: '24h' | '4d' | '90d' = '24h',
  ): Promise<(HttpPingBucketSerialized | null)[]> {
    return this.httpPingBucketAggregateService.getBucketsForMonitor(monitorId, period);
  }
}
