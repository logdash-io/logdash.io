import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Sse,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiResponseProperty,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Observable, concat, filter, from, fromEvent, map } from 'rxjs';
import { ApiKeyReadCachedService } from '../../api-key/read/api-key-read-cached.service';
import { Public } from '../../auth/core/decorators/is-public';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { SuccessResponse } from '../../shared/responses/success.response';
import { LogCreatedEvent } from '../events/definitions/log-created.event';
import { LogEventEmitter } from '../events/log-event.emitter';
import { LogEvents } from '../events/log-events.enum';
import { LogQueueingService } from '../queueing/log-queueing.service';
import { LogRateLimitService } from '../rate-limit/log-rate-limit.service';
import { LogReadService } from '../read/log-read.service';
import { DemoEndpoint } from '../../demo/decorators/demo-endpoint.decorator';
import { CreateLogBody } from './dto/create-log.body';
import { CreateLogsBatchBody } from './dto/create-logs-batch.body';
import { ReadLogsQuery } from './dto/read-newer-than.query';
import { StreamProjectLogsQuery } from './dto/stream-project-logs.query';
import { LogSerialized } from './entities/log.interface';
import { LogSerializer } from './entities/log.serializer';
import { LogReadDirection } from './enums/log-read-direction.enum';
import { DemoCacheInterceptor } from '../../demo/interceptors/demo-cache.interceptor';

@Controller('')
@ApiTags('Logs')
export class LogCoreController {
  constructor(
    private readonly logReadService: LogReadService,
    private readonly logQueueingService: LogQueueingService,
    private readonly apiKeyReadCachedService: ApiKeyReadCachedService,
    private readonly logEventEmitter: LogEventEmitter,
    private readonly eventEmitter: EventEmitter2,
    private readonly logRateLimitService: LogRateLimitService,
  ) {}

  @DemoEndpoint()
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @Sse('projects/:projectId/logs/sse')
  public async streamProjectLogs(
    @Query() dto: StreamProjectLogsQuery,
    @Param('projectId') projectId: string,
  ): Promise<Observable<any>> {
    const eventStream$ = fromEvent(this.eventEmitter, LogEvents.LogCreatedEvent).pipe(
      filter((data: LogCreatedEvent) => {
        return data.projectId === projectId;
      }),
      map((data) => ({ data })),
    );

    let historicalLogs$: Observable<{ data: LogSerialized }> = from([]);

    if (dto.lastId) {
      const historicalLogs = await this.logReadService.readMany({
        projectId,
        lastId: dto.lastId,
        direction: LogReadDirection.After,
        limit: 100,
      });

      historicalLogs$ = from(historicalLogs).pipe(
        map((log) => ({ data: LogSerializer.serialize(log) })),
      );
    }

    const combinedStream$ = concat(historicalLogs$, eventStream$);

    return new Observable((observer) => {
      const subscription = combinedStream$.subscribe(observer);

      return () => {
        subscription.unsubscribe();
      };
    });
  }

  @Public()
  @Post('logs')
  @ApiSecurity('project-api-key')
  @ApiResponseProperty({ type: SuccessResponse })
  public async create(
    @Body() dto: CreateLogBody,
    @Headers('project-api-key') apiKeyValue: string,
  ): Promise<SuccessResponse> {
    const projectId = await this.apiKeyReadCachedService.readProjectId(apiKeyValue);

    if (!projectId) {
      throw new UnauthorizedException('Invalid API key');
    }

    await this.logRateLimitService.requireWithinLimit(projectId);

    const result = this.logQueueingService.queueLog({
      ...dto,
      createdAt: new Date(dto.createdAt),
      projectId,
    });

    this.logEventEmitter.emitLogCreatedEvent({
      id: result.id,
      createdAt: dto.createdAt,
      projectId,
      level: dto.level,
      message: dto.message,
      sequenceNumber: dto.sequenceNumber,
    });

    return new SuccessResponse();
  }

  @Public()
  @Post('logs/batch')
  @ApiSecurity('project-api-key')
  @ApiResponseProperty({ type: SuccessResponse })
  public async createBatch(
    @Body() dto: CreateLogsBatchBody,
    @Headers('project-api-key') apiKeyValue: string,
  ): Promise<SuccessResponse> {
    const projectId = await this.apiKeyReadCachedService.readProjectId(apiKeyValue);

    if (!projectId) {
      throw new UnauthorizedException('Invalid API key');
    }

    await this.logRateLimitService.requireWithinLimit(projectId, dto.logs.length);

    dto.logs.forEach((logDto) => {
      const result = this.logQueueingService.queueLog({
        ...logDto,
        createdAt: new Date(logDto.createdAt),
        projectId,
      });

      this.logEventEmitter.emitLogCreatedEvent({
        id: result.id,
        createdAt: logDto.createdAt,
        projectId,
        level: logDto.level,
        message: logDto.message,
        sequenceNumber: logDto.sequenceNumber,
      });
    });

    return new SuccessResponse();
  }

  @DemoEndpoint()
  @UseInterceptors(DemoCacheInterceptor)
  @UseGuards(ClusterMemberGuard)
  @ApiBearerAuth()
  @Get('projects/:projectId/logs')
  @ApiResponse({ type: LogSerialized, isArray: true })
  public async readNewerThanGuarded(
    @Param('projectId') projectId: string,
    @Query() dto: ReadLogsQuery,
  ): Promise<LogSerialized[]> {
    if ((dto.lastId && !dto.direction) || (!dto.lastId && dto.direction)) {
      throw new BadRequestException('Provide either lastId and direction or neither');
    }

    const logs = await this.logReadService.readMany({
      direction: dto.direction,
      lastId: dto.lastId,
      projectId,
      limit: dto.limit ?? 50,
    });

    return logs.map((log) => LogSerializer.serialize(log));
  }
}
