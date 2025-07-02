import { Logger, Metrics } from '@logdash/js-sdk';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { HttpMonitorNormalized } from 'src/http-monitor/core/entities/http-monitor.interface';
import { ProjectReadService } from 'src/project/read/project-read.service';
import { UserPlanConfigs } from 'src/shared/configs/user-plan-configs';
import { UserTier } from 'src/user/core/enum/user-tier.enum';
import { UserReadService } from 'src/user/read/user-read.service';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { AverageRecorder } from '../../shared/logdash/average-metric-recorder.service';
import { HttpPingEventEmitter } from '../events/http-ping-event.emitter';
import { CreateHttpPingDto } from '../write/dto/create-http-ping.dto';
import { HttpPingWriteService } from '../write/http-ping-write.service';
import { HttpPingSchedulerDataService } from './http-ping-scheduler.data-service';

interface QueueItem {
  monitor: HttpMonitorNormalized;
  promise: Promise<CreateHttpPingDto>;
}

export const MAX_CONCURRENT_REQUESTS_TOKEN = 'MAX_CONCURRENT_REQUESTS_TOKEN';

@Injectable()
export class HttpPingSchedulerService {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpPingWriteService: HttpPingWriteService,
    private readonly httpPingEventEmitter: HttpPingEventEmitter,
    private readonly logger: Logger,
    private readonly metrics: Metrics,
    private readonly averageRecorder: AverageRecorder,
    @Inject(MAX_CONCURRENT_REQUESTS_TOKEN)
    private readonly maxConcurrentRequests: number,
    private readonly httpPingSchedulerDataService: HttpPingSchedulerDataService,
    private readonly userReadService: UserReadService,
    private readonly projectReadService: ProjectReadService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  private async triggerPingMonitors1m(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const tiers = this.getTiersWithFrequency(CronExpression.EVERY_MINUTE);
    await this.tryPingMonitors(tiers);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  private async triggerPingMonitors5m(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const tiers = this.getTiersWithFrequency(CronExpression.EVERY_5_MINUTES);
    await this.tryPingMonitors(tiers);
  }

  private getTiersWithFrequency(frequency: CronExpression): UserTier[] {
    return Object.entries(UserPlanConfigs)
      .filter(([_, value]) => value.pings.frequency === frequency)
      .map(([key]) => key as keyof typeof UserPlanConfigs);
  }

  public async tryPingMonitors(userTiers: UserTier[]): Promise<void> {
    try {
      await this.pingMonitors(userTiers);
    } catch (error) {
      this.logger.error('Error processing HTTP pings:', { errorMessage: error.message });
    }
  }

  private async pingMonitors(userTiers: UserTier[]): Promise<void> {
    const startTime = Date.now();
    const queue: QueueItem[] = [];
    const results: CreateHttpPingDto[] = [];

    const usersIds = (await this.userReadService.readByTiers(userTiers)).map((u) => u.id);
    const projectsIds = (await this.projectReadService.readManyByCreatorsIds(usersIds)).map(
      (p) => p.id,
    );

    for await (const monitor of this.httpMonitorReadService.readManyByProjectIdsCursor(
      projectsIds,
    )) {
      if (queue.length >= this.maxConcurrentRequests) {
        const completedItem = await Promise.race(
          queue.map(async (item) => {
            const result = await item.promise;
            return { item, result };
          }),
        );
        queue.splice(queue.indexOf(completedItem.item), 1);
        results.push(completedItem.result);
      }

      queue.push({ monitor, promise: this.pingMonitor(monitor) });
    }

    const remainingResults = await Promise.all(queue.map((item) => item.promise));
    results.push(...remainingResults);

    await this.saveCompletedPings(results);

    const totalDuration = Date.now() - startTime;
    await this.averageRecorder.record('httpPingsDurationMs', totalDuration);
    this.metrics.mutate('pingsMade', results.length);
  }

  public async pingSingleMonitor(httpMonitorId: string): Promise<void> {
    const monitor = await this.httpMonitorReadService.readById(httpMonitorId);
    if (!monitor) {
      throw new Error('Monitor not found');
    }

    const ping = await this.pingMonitor(monitor);
    await this.saveCompletedPings([ping]);
  }

  private async pingMonitor(monitor: HttpMonitorNormalized): Promise<CreateHttpPingDto> {
    const startTime = Date.now();
    try {
      const response = await this.makeHttpRequest(monitor.url);
      return this.createPingResult(monitor, response, startTime);
    } catch (error) {
      return this.createPingResult(monitor, null, startTime, error);
    }
  }

  private async makeHttpRequest(url: string) {
    return axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
    });
  }

  private createPingResult(
    monitor: HttpMonitorNormalized,
    response: any,
    startTime: number,
    error?: any,
  ): CreateHttpPingDto {
    const message = this.getMessage(response, error);
    const isError = response?.status >= 400 || response?.status < 200 || response?.status === 0;

    return {
      httpMonitorId: monitor.id,
      statusCode: response?.status || 0,
      responseTimeMs: this.calculateResponseTime(startTime),
      message: isError ? message.substring(0, 1000) : undefined,
    };
  }

  private getMessage(response: any, error: any): string {
    let jsonStringified;
    try {
      jsonStringified = JSON.stringify(response?.data);
    } catch {
      jsonStringified = null;
    }

    return (
      (typeof response?.data === 'string' ? response.data.substring(0, 1000) : jsonStringified) ||
      response?.statusText ||
      error?.message ||
      'Unknown error'
    );
  }

  private calculateResponseTime(startTime: number): number {
    return Number((Date.now() - startTime).toFixed(2));
  }

  private async saveCompletedPings(pings: CreateHttpPingDto[]): Promise<void> {
    if (pings.length === 0) return;

    const savedPings = await this.httpPingWriteService.createMany(pings);

    const clusterIds = await this.httpPingSchedulerDataService.readClusterIdsByMonitorIds(
      savedPings.map((ping) => ping.httpMonitorId),
    );

    for (const ping of savedPings) {
      await this.httpPingEventEmitter.emitHttpPingCreatedEvent({
        ...ping,
        clusterId: clusterIds[ping.httpMonitorId],
      });
    }
  }
}
