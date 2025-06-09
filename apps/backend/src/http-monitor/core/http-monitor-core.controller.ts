import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { HttpMonitorLimitService } from '../limit/http-monitor-limit.service';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { HttpMonitorWriteService } from '../write/http-monitor-write.service';
import { CreateHttpMonitorBody } from './dto/create-http-monitor.body';
import { HttpMonitorSerialized } from './entities/http-monitor.interface';
import { HttpMonitorSerializer } from './entities/http-monitor.serializer';
import { UpdateHttpMonitorBody } from './dto/update-http-monitor.body';

@ApiBearerAuth()
@ApiTags('Http Monitors')
@Controller('')
@UseGuards(ClusterMemberGuard)
export class HttpMonitorCoreController {
  constructor(
    private readonly httpMonitorWriteService: HttpMonitorWriteService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorLimitService: HttpMonitorLimitService,
  ) {}

  @Post('projects/:projectId/http_monitors')
  @ApiResponse({ type: HttpMonitorSerialized })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateHttpMonitorBody,
  ): Promise<HttpMonitorSerialized> {
    const hasCapacity = await this.httpMonitorLimitService.hasCapacity(projectId);
    if (!hasCapacity) {
      throw new ConflictException(
        'You have reached the maximum number of monitors for this project',
      );
    }

    const httpMonitor = await this.httpMonitorWriteService.create(projectId, dto);
    return HttpMonitorSerializer.serialize(httpMonitor);
  }

  @Get('projects/:projectId/http_monitors')
  @ApiResponse({ type: HttpMonitorSerialized, isArray: true })
  async readByProjectId(@Param('projectId') projectId: string): Promise<HttpMonitorSerialized[]> {
    const httpMonitors = await this.httpMonitorReadService.readByProjectId(projectId);
    return HttpMonitorSerializer.serializeMany(httpMonitors);
  }

  @Put('/http_monitors/:httpMonitorId')
  @ApiResponse({ type: HttpMonitorSerialized })
  async update(
    @Param('httpMonitorId') httpMonitorId: string,
    @Body() dto: UpdateHttpMonitorBody,
  ): Promise<HttpMonitorSerialized> {
    const httpMonitor = await this.httpMonitorWriteService.update(httpMonitorId, dto);

    return HttpMonitorSerializer.serialize(httpMonitor);
  }
}
