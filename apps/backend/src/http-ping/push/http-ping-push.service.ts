import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@logdash/js-sdk';
import { RedisService } from '../../shared/redis/redis.service';
import { HttpMonitorReadService } from '../../http-monitor/read/http-monitor-read.service';
import { HttpMonitorMode } from '../../http-monitor/core/enums/http-monitor-mode.enum';
import { HttpPingWriteService } from '../write/http-ping-write.service';
import { HttpPingEventEmitter } from '../events/http-ping-event.emitter';
import { CreateHttpPingDto } from '../write/dto/create-http-ping.dto';
import { HttpPingPingerDataService } from '../pinger/http-ping-pinger.data-service';

const PUSH_RECORD_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class HttpPingPushService {
  constructor(
    private readonly redisService: RedisService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpPingWriteService: HttpPingWriteService,
    private readonly httpPingEventEmitter: HttpPingEventEmitter,
    private readonly httpPingPingerDataService: HttpPingPingerDataService,
    private readonly logger: Logger,
  ) {}

  private getPushRecordKey(httpMonitorId: string): string {
    return `http-ping-push:${httpMonitorId}`;
  }

  public async record(httpMonitorId: string): Promise<void> {
    const key = this.getPushRecordKey(httpMonitorId);
    const existingRecord = await this.redisService.get(key);

    if (existingRecord) {
      // Record already exists, no need to update
      return;
    }

    // Record the ping with TTL
    await this.redisService.set(key, Date.now().toString(), PUSH_RECORD_TTL_SECONDS);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  private async processPushMonitors(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      await this.checkPushMonitors();
    } catch (error) {
      this.logger.error('Error processing push monitors:', { errorMessage: error.message });
    }
  }

  public async checkPushMonitors(): Promise<void> {
    const pushMonitors = await this.httpMonitorReadService.readManyByMode(HttpMonitorMode.Push);

    if (pushMonitors.length === 0) {
      return;
    }

    const pings: CreateHttpPingDto[] = [];

    for (const monitor of pushMonitors) {
      const key = this.getPushRecordKey(monitor.id);
      const record = await this.redisService.get(key);

      if (record) {
        // Monitor received ping, record success
        await this.redisService.del(key);

        pings.push({
          httpMonitorId: monitor.id,
          statusCode: 200,
          responseTimeMs: 0,
          message: undefined,
        });
      } else {
        // Monitor did not receive ping, record failure
        pings.push({
          httpMonitorId: monitor.id,
          statusCode: 0,
          responseTimeMs: 0,
          message: 'Did not receive call for this time range',
        });
      }
    }

    if (pings.length > 0) {
      await this.saveCompletedPings(pings);
    }
  }

  private async saveCompletedPings(pings: CreateHttpPingDto[]): Promise<void> {
    if (pings.length === 0) return;

    const savedPings = await this.httpPingWriteService.createMany(pings);

    const clusterIds = await this.httpPingPingerDataService.readClusterIdsByMonitorIds(
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
