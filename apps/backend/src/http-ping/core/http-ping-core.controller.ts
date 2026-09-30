import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Sse,
  UseGuards,
  UseInterceptors,
  MessageEvent,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { map, Observable } from 'rxjs';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { RequireScope } from '../../auth/core/decorators/require-scope.decorator';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';
import { Action } from '../../personal-api-key/core/enums/action.enum';
import { DemoEndpoint } from '../../demo/decorators/demo-endpoint.decorator';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpPingCreatedEvent } from '../events/definitions/http-ping-created.event';
import { HttpPingEvent } from '../events/http-ping-event.enum';
import { HttpPingSerialized } from './entities/http-ping.interface';
import { HttpPingSerializer } from './entities/http-ping.serializer';
import { HttpPingReadService } from '../read/http-ping-read.service';
import { ReadByMonitorIdQuery } from './dto/read-by-monitor-id.query';
import { DemoCacheInterceptor } from '../../demo/interceptors/demo-cache.interceptor';
import { KeyedEventStream } from '../../shared/utils/keyed-event-stream';

@ApiBearerAuth()
@ApiTags('HTTP Pings')
@Controller()
@UseGuards(ClusterMemberGuard)
export class HttpPingCoreController {
  private readonly pingStream = new KeyedEventStream<HttpPingCreatedEvent>(
    this.eventEmitter,
    HttpPingEvent.HttpPingCreatedEvent,
    (event) => event.clusterId,
  );

  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpPingReadService: HttpPingReadService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @UseInterceptors(DemoCacheInterceptor)
  @DemoEndpoint()
  @RequireScope(Resource.Monitors, Action.Read)
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
      throw new NotFoundException('Monitor not found in this service');
    }

    const pings = await this.httpPingReadService.readByMonitorId(monitorId, query.limit);

    return HttpPingSerializer.serializeMany(pings);
  }

  @DemoEndpoint()
  @ApiBearerAuth()
  @Sse('clusters/:clusterId/http_pings/sse')
  public streamHttpMonitorPings(@Param('clusterId') clusterId: string): Observable<MessageEvent> {
    const eventStream$ = this.pingStream.stream(clusterId).pipe(map((data) => ({ data })));

    return new Observable<MessageEvent>((observer) => {
      const subscription = eventStream$.subscribe(observer);

      return () => {
        subscription.unsubscribe();
      };
    });
  }
}
