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
import { HttpPingCron } from '../core/enums/http-ping-cron.enum';
import { ProjectTier } from 'src/project/core/enums/project-tier.enum';
import { ProjectReadService } from 'src/project/read/project-read.service';
import { ProjectPlanConfigs } from '../../shared/configs/project-plan-configs';

const PUSH_RECORD_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class HttpPingPushService {
  constructor(
    private readonly redisService: RedisService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpPingWriteService: HttpPingWriteService,
    private readonly httpPingEventEmitter: HttpPingEventEmitter,
    private readonly httpPingPingerDataService: HttpPingPingerDataService,
    private readonly projectReadService: ProjectReadService,
    private readonly logger: Logger,
  ) {}

  private getPushRecordKey(httpMonitorId: string): string {
    return `http-ping-push:${httpMonitorId}`;
  }

  public async record(httpMonitorId: string): Promise<void> {
    const key = this.getPushRecordKey(httpMonitorId);
    const existingRecord = await this.redisService.get(key);

    if (existingRecord) {
      return;
    }

    await this.redisService.set(key, Date.now().toString(), PUSH_RECORD_TTL_SECONDS);
  }

  @Cron(HttpPingCron.Every15Seconds)
  private async processPushMonitors15s(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const tiers = this.getTiersWithFrequency(HttpPingCron.Every15Seconds);
    await this.tryCheckPushMonitors(tiers);
  }

  @Cron(HttpPingCron.EveryMinute)
  private async processPushMonitors1m(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const tiers = this.getTiersWithFrequency(HttpPingCron.EveryMinute);
    await this.tryCheckPushMonitors(tiers);
  }

  @Cron(HttpPingCron.Every5Minutes)
  private async processPushMonitors5m(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const tiers = this.getTiersWithFrequency(HttpPingCron.Every5Minutes);
    await this.tryCheckPushMonitors(tiers);
  }

  private getTiersWithFrequency(frequency: HttpPingCron): ProjectTier[] {
    return Object.entries(ProjectPlanConfigs)
      .filter(([_, value]) => value.httpMonitors.pingFrequency === frequency)
      .map(([key]) => key as keyof typeof ProjectPlanConfigs);
  }

  public async tryCheckPushMonitors(projectTiers: ProjectTier[]): Promise<void> {
    try {
      await this.checkPushMonitors(projectTiers);
    } catch (error) {
      this.logger.error('Error processing push monitors:', { errorMessage: error.message });
    }
  }

  public async checkPushMonitors(projectTiers: ProjectTier[]): Promise<void> {
    const projectsIds = (await this.projectReadService.readManyByTiers(projectTiers)).map(
      (p) => p.id,
    );

    const pushMonitors = await this.httpMonitorReadService.readManyByProjectIdsAndMode(
      projectsIds,
      HttpMonitorMode.Push,
    );

    if (pushMonitors.length === 0) {
      return;
    }

    const pings: CreateHttpPingDto[] = [];

    for (const monitor of pushMonitors) {
      const key = this.getPushRecordKey(monitor.id);
      const record = await this.redisService.get(key);

      if (record) {
<<<<<<< Updated upstream
        // Monitor received ping, record success
        await this.redisService.del(key);

=======
        // Monitor received ping, record success and delete the key
        await this.redisService.del(key);
>>>>>>> Stashed changes
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
