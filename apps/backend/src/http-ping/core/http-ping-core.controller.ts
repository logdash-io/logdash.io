import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpPingReadService } from '../read/http-ping-read.service';
import { HttpPingSerialized } from './entities/http-ping.interface';
import { HttpPingSerializer } from './entities/http-ping.serializer';

@ApiBearerAuth()
@ApiTags('Http Pings')
@Controller()
@UseGuards(ClusterMemberGuard)
export class HttpPingCoreController {
  constructor(
    private readonly httpPingReadService: HttpPingReadService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
  ) {}

  @Get('clusters/:clusterId/monitors/:monitorId/http_pings')
  @ApiResponse({ type: HttpPingSerialized, isArray: true })
  async findByMonitorId(
    @Param('clusterId') clusterId: string,
    @Param('monitorId') monitorId: string,
  ): Promise<HttpPingSerialized[]> {
    const monitor = await this.httpMonitorReadService.readById(monitorId);
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.clusterId !== clusterId) {
      throw new NotFoundException('Monitor not found in this cluster');
    }

    const pings = await this.httpPingReadService.readByMonitorId(monitorId);

    return HttpPingSerializer.serializeMany(pings);
  }
}
