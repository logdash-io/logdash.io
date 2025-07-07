import { Body, Controller, Param, Post, UseGuards, Ip } from '@nestjs/common';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { LogQueueingService } from '../queueing/log-queueing.service';
import { LogLevel } from '../core/enums/log-level.enum';
import { SuccessResponse } from '../../shared/responses/success.response';
import { ApiResponse } from '@nestjs/swagger';
import { AddTestLogRateLimitService } from './add-test-log-rate-limit.service';
import { DemoEndpoint } from '../../demo/decorators/demo-endpoint.decorator';
import { LogEventEmitter } from '../events/log-event.emitter';

@Controller('')
export class AddTestLogController {
  constructor(
    private readonly logQueueingService: LogQueueingService,
    private readonly addTestLogRateLimitService: AddTestLogRateLimitService,
    private readonly logEventEmitter: LogEventEmitter,
  ) {}

  @DemoEndpoint()
  @ApiResponse({
    type: SuccessResponse,
  })
  @UseGuards(ClusterMemberGuard)
  @Post('projects/:projectId/test-log')
  public async addTestLog(@Ip() ip: string, @Param('projectId') projectId: string) {
    await this.addTestLogRateLimitService.checkAndIncrement(projectId, ip);

    const animal = await this.addTestLogRateLimitService.getAnimal(ip);

    const queueLogDto = {
      createdAt: new Date(),
      message: `[TEST] ${animal} sent log to our production dashboard`,
      projectId,
      level: LogLevel.Debug,
    };

    const result = this.logQueueingService.queueLog(queueLogDto);

    this.logEventEmitter.emitLogCreatedEvent({
      ...queueLogDto,
      createdAt: queueLogDto.createdAt.toISOString(),
      id: result.id,
      sequenceNumber: 1,
    });

    return new SuccessResponse();
  }
}
