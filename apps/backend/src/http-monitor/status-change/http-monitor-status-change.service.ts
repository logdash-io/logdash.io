import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpPingEvent } from '../../http-ping/events/http-ping-event.enum';
import { HttpPingCreatedEvent } from '../../http-ping/events/definitions/http-ping-created.event';
import { PingStatus } from './enum/ping-status.enum';
import { RedisService } from '../../shared/redis/redis.service';
import { NotificationChannelMessagingService } from '../../notification-channel/messaging/notification-channel-messaging.service';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';

@Injectable()
export class HttpMonitorStatusChangeService {
  constructor(
    private readonly redisService: RedisService,
    private readonly notificationChannelMessagingService: NotificationChannelMessagingService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
  ) {}

  @OnEvent(HttpPingEvent.HttpPingCreatedEvent)
  public async handleHttpPingCreatedEvent(event: HttpPingCreatedEvent) {
    const newStatus = this.computePingStatusFromStatusCode(event.statusCode);
    const previousStatus = await this.getStatus(event.httpMonitorId);

    await this.setStatus(event.httpMonitorId, newStatus);

    if (previousStatus === PingStatus.Unknown || previousStatus != newStatus) {
      await this.dispatchStatusChangedMessage(event.httpMonitorId, newStatus);
    }
  }

  private computePingStatusFromStatusCode(statusCode: number): PingStatus {
    return statusCode >= 200 && statusCode < 400 ? PingStatus.Up : PingStatus.Down;
  }

  private async getStatus(httpMonitorId: string): Promise<PingStatus> {
    const previousStatus = await this.redisService.get(this.getRedisKey(httpMonitorId));

    if (!previousStatus) {
      return PingStatus.Unknown;
    }

    return previousStatus as PingStatus;
  }

  private async setStatus(httpMonitorId: string, status: PingStatus) {
    await this.redisService.set(this.getRedisKey(httpMonitorId), status);
  }

  private async dispatchStatusChangedMessage(httpMonitorId: string, newStatus: PingStatus) {
    const httpMonitor = await this.httpMonitorReadService.readById(httpMonitorId);

    if (!httpMonitor) {
      return;
    }

    await this.notificationChannelMessagingService.sendMessage({
      notificationChannelsIds: httpMonitor.notificationChannelsIds,
      message: `HTTP monitor ${httpMonitor.name} is ${newStatus}`,
    });
  }

  private getRedisKey(httpMonitorId: string): string {
    return `http-monitor:${httpMonitorId}:status`;
  }
}
