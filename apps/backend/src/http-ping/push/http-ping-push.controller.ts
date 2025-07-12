import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpPingPushService } from './http-ping-push.service';

@ApiBearerAuth()
@ApiTags('HTTP Ping Push Gateway')
@Controller('http_monitors/:httpMonitorId/push')
@UseGuards(ClusterMemberGuard)
export class HttpPingPushController {
  constructor(private readonly httpPingPushService: HttpPingPushService) {}

  @Post()
  async recordPing(@Param('httpMonitorId') httpMonitorId: string): Promise<void> {
    await this.httpPingPushService.record(httpMonitorId);
  }
}
