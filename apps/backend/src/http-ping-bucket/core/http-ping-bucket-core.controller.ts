import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpPingBucketSerialized } from '../../http-ping-bucket/core/entities/http-ping-bucket.interface';
import { HttpPingBucketAggregationService } from '../aggregation/http-ping-bucket-aggregation.service';
import { GetBucketsQuery } from './dto/get_buckets.query';

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
    @Query() query: GetBucketsQuery,
  ): Promise<(HttpPingBucketSerialized | null)[]> {
    return this.httpPingBucketAggregateService.getBucketsForMonitor(monitorId, query.period);
  }
}
