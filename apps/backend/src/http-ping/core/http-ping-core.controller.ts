import { Controller, Get, NotFoundException, Param, Query, Sse, UseGuards } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { filter, fromEvent, map, Observable } from 'rxjs';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { DemoEndpoint } from '../../demo/decorators/demo-endpoint.decorator';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpPingCreatedEvent } from '../events/definitions/http-ping-created.event';
import { HttpPingEvent } from '../events/http-ping-event.enum';
import { HttpPingSerialized } from './entities/http-ping.interface';
import { HttpPingSerializer } from './entities/http-ping.serializer';
import { HttpPingReadService } from '../read/http-ping-read.service';
import { ReadByMonitorIdQuery } from './dto/read-by-monitor-id.query';

@ApiBearerAuth()
@ApiTags('HTTP Pings')
@Controller()
@UseGuards(ClusterMemberGuard)
export class HttpPingCoreController {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpPingReadService: HttpPingReadService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @DemoEndpoint()
  @Get('projects/:projectId/monitors/:monitorId/http_pings')
  @ApiResponse({ type: HttpPingSerialized, isArray: true })
  async readByMonitorIdQuery(
    @Param('projectId') projectId: string,
    @Param('monitorId') monitorId: string,
    @Query() query: ReadByMonitorIdQuery,
  ): Promise<HttpPingSerialized[]> {
    const monitor = await this.httpMonitorReadService.readById(monitorId);
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    if (monitor.projectId !== projectId) {
      throw new NotFoundException('Monitor not found in this project');
    }

    const pings = await this.httpPingReadService.readByMonitorId(monitorId, query.limit);

    return HttpPingSerializer.serializeMany(pings);
  }

  @DemoEndpoint()
  @ApiBearerAuth()
  @Sse('clusters/:clusterId/http_pings/sse')
  public async streamHttpMonitorPings(
    @Param('clusterId') clusterId: string,
  ): Promise<Observable<any>> {
    const eventStream$ = fromEvent(this.eventEmitter, HttpPingEvent.HttpPingCreatedEvent).pipe(
      filter((data: HttpPingCreatedEvent) => data.clusterId === clusterId),
      map((data: HttpPingCreatedEvent) => ({ data })),
    );

    return new Observable((observer) => {
      const subscription = eventStream$.subscribe(observer);

      return () => {
        subscription.unsubscribe();
      };
    });
  }
}
