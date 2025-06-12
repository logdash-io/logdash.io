import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpPingEvent } from '../../http-ping/events/http-ping-event.enum';
import { HttpPingCreatedEvent } from '../../http-ping/events/definitions/http-ping-created.event';
import { HttpMonitorStatus } from './enum/http-monitor-status.enum';
import { RedisService } from '../../shared/redis/redis.service';
import { NotificationChannelMessagingService } from '../../notification-channel/messaging/notification-channel-messaging.service';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { HttpMonitorStatusService } from './http-monitor-status.service';

@Injectable()
export class HttpMonitorStatusChangeService {
  constructor(
    private readonly notificationChannelMessagingService: NotificationChannelMessagingService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorStatusService: HttpMonitorStatusService,
  ) {}

  @OnEvent(HttpPingEvent.HttpPingCreatedEvent)
  public async handleHttpPingCreatedEvent(event: HttpPingCreatedEvent) {
    const newStatus = this.computePingStatusFromStatusCode(event.statusCode);
    const previousStatus = await this.httpMonitorStatusService.getStatus(event.httpMonitorId);

    await this.httpMonitorStatusService.setStatus(event.httpMonitorId, {
      status: newStatus,
      statusCode: event.statusCode.toString(),
    });

    if (previousStatus.status === HttpMonitorStatus.Unknown || previousStatus.status != newStatus) {
      await this.dispatchStatusChangedMessage(event.httpMonitorId, newStatus);
    }
  }

  private computePingStatusFromStatusCode(statusCode: number): HttpMonitorStatus {
    return statusCode >= 200 && statusCode < 400 ? HttpMonitorStatus.Up : HttpMonitorStatus.Down;
  }

  private async dispatchStatusChangedMessage(httpMonitorId: string, newStatus: HttpMonitorStatus) {
    const httpMonitor = await this.httpMonitorReadService.readById(httpMonitorId);

    if (!httpMonitor) {
      return;
    }

    const message = this.createStatusMessage(httpMonitor.name, newStatus);

    await this.notificationChannelMessagingService.sendMessage({
      notificationChannelsIds: httpMonitor.notificationChannelsIds,
      message,
    });
  }

  private createStatusMessage(monitorName: string, status: HttpMonitorStatus): string {
    switch (status) {
      case HttpMonitorStatus.Up:
        return `✅ "${monitorName}" is back online!`;
      case HttpMonitorStatus.Down:
        return `❌ "${monitorName}" is down!`;
    }

    return '';
  }
}
