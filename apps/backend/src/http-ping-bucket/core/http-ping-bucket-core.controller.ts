import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpPingBucketSerialized } from '../../http-ping-bucket/core/entities/http-ping-bucket.interface';
import { HttpPingBucketAggregateService } from '../aggregate/http-ping-bucket-aggregate.service';

@ApiBearerAuth()
@ApiTags('HTTP Ping Buckets')
@Controller()
@UseGuards(ClusterMemberGuard)
export class HttpPingBucketCoreController {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpPingBucketAggregateService: HttpPingBucketAggregateService,
  ) {}

  @Get('projects/:projectId/monitors/:monitorId/http_ping_buckets')
  @ApiResponse({ type: HttpPingBucketSerialized, isArray: true })
  async findBucketsByMonitorId(
    @Param('projectId') projectId: string,
    @Param('monitorId') monitorId: string,
    @Query('period') period: '24h' | '4d' | '90d' = '24h',
  ): Promise<(HttpPingBucketSerialized | null)[]> {
    await this.requireMonitorAccess(projectId, monitorId);

    return this.httpPingBucketAggregateService.getBucketsForMonitor(monitorId, period);
  }

  private async requireMonitorAccess(projectId: string, monitorId: string): Promise<void> {
    const monitor = await this.httpMonitorReadService.readById(monitorId);
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.projectId !== projectId) {
      throw new NotFoundException('Monitor not found in this project');
    }
  }
}
