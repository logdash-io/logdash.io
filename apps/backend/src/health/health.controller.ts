import {
  BeforeApplicationShutdown,
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ApiTags } from '@nestjs/swagger';
import { setTimeout as sleep } from 'node:timers/promises';
import { Public } from '../auth/core/decorators/is-public';
import { SuccessResponse } from '../shared/responses/success.response';

@ApiTags('Health')
@Controller()
export class HealthController implements BeforeApplicationShutdown {
  private draining = false;

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  @Get('/health')
  @Public()
  public getHealth(): SuccessResponse {
    if (this.draining) {
      throw new ServiceUnavailableException('Shutting down');
    }

    return new SuccessResponse();
  }

  public async beforeApplicationShutdown(signal?: string): Promise<void> {
    const drainMs = Number(process.env.SHUTDOWN_DRAIN_MS ?? 0);

    if (signal !== 'SIGTERM' || !drainMs) {
      return;
    }

    this.draining = true;

    for (const job of this.schedulerRegistry.getCronJobs().values()) {
      void job.stop();
    }

    await sleep(drainMs);
  }
}
