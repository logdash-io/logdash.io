import { Logger, Metrics } from '@logdash/js-sdk';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { HttpMonitorNormalized } from 'src/http-monitor/core/entities/http-monitor.interface';
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
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async tryPingAllMonitors(): Promise<void> {
    try {
      await this.pingAllMonitors();
    } catch (error) {
      this.logger.error('Error processing HTTP pings:', { errorMessage: error.message });
    }
  }

  private async pingAllMonitors(): Promise<void> {
    const startTime = Date.now();
    const queue: QueueItem[] = [];
    const results: CreateHttpPingDto[] = [];

    for await (const monitor of this.httpMonitorReadService.readAllCursor()) {
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
    return {
      httpMonitorId: monitor.id,
      statusCode: response?.status || 0,
      responseTimeMs: this.calculateResponseTime(startTime),
      message: response?.statusText || error?.message?.substring(0, 1000) || 'Unknown error',
    };
  }

  private calculateResponseTime(startTime: number): number {
    return Number((Date.now() - startTime).toFixed(2));
  }

  private async saveCompletedPings(pings: CreateHttpPingDto[]): Promise<void> {
    if (pings.length === 0) return;

    const [savedPings] = await Promise.all([this.httpPingWriteService.createMany(pings)]);

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
