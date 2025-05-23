import { Body, ConflictException, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpMonitorLimitService } from '../limit/http-monitor-limit.service';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { HttpMonitorWriteService } from '../write/http-monitor-write.service';
import { CreateHttpMonitorBody } from './dto/create-http-monitor.body';
import { HttpMonitorSerialized } from './entities/http-monitor.interface';
import { HttpMonitorSerializer } from './entities/http-monitor.serializer';

@ApiBearerAuth()
@ApiTags('Http Monitors')
@Controller('clusters/:clusterId/http_monitors')
@UseGuards(ClusterMemberGuard)
export class HttpMonitorCoreController {
  constructor(
    private readonly httpMonitorWriteService: HttpMonitorWriteService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorLimitService: HttpMonitorLimitService,
  ) {}

  @Post()
  @ApiResponse({ type: HttpMonitorSerialized })
  async create(
    @Param('clusterId') clusterId: string,
    @Body() dto: CreateHttpMonitorBody,
  ): Promise<HttpMonitorSerialized> {
    const hasCapacity = await this.httpMonitorLimitService.hasCapacity(clusterId);
    if (!hasCapacity) {
      throw new ConflictException(
        'You have reached the maximum number of monitors for this cluster',
      );
    }

    const httpMonitor = await this.httpMonitorWriteService.create(clusterId, dto);
    return HttpMonitorSerializer.serialize(httpMonitor);
  }

  @Get()
  @ApiResponse({ type: HttpMonitorSerialized, isArray: true })
  async findAll(@Param('clusterId') clusterId: string): Promise<HttpMonitorSerialized[]> {
    const httpMonitors = await this.httpMonitorReadService.readByClusterId(clusterId);
    return HttpMonitorSerializer.serializeMany(httpMonitors);
  }
}
