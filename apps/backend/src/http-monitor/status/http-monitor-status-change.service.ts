import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpPingEvent } from '../../http-ping/events/http-ping-event.enum';
import { HttpPingCreatedEvent } from '../../http-ping/events/definitions/http-ping-created.event';
import { HttpMonitorStatus } from './enum/http-monitor-status.enum';
import { RedisService } from '../../shared/redis/redis.service';
import { NotificationChannelMessagingService } from '../../notification-channel/messaging/notification-channel-messaging.service';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { HttpMonitorStatusService } from './http-monitor-status.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { HTTP_MONITORS_LOGGER } from '../../shared/logdash/logdash-tokens';

@Injectable()
export class HttpMonitorStatusChangeService {
  constructor(
    private readonly notificationChannelMessagingService: NotificationChannelMessagingService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorStatusService: HttpMonitorStatusService,
    @Inject(HTTP_MONITORS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  @OnEvent(HttpPingEvent.HttpPingCreatedEvent)
  public async tryHandleHttpPingCreatedEvent(event: HttpPingCreatedEvent) {
    try {
      await this.handleHttpPingCreatedEvent(event);
    } catch (error) {
      this.logger.error('Error handling http ping created event', {
        error,
        event,
      });
    }
  }

  public async handleHttpPingCreatedEvent(event: HttpPingCreatedEvent) {
    const newStatus = this.computePingStatusFromStatusCode(event.statusCode);
    const previousStatus = await this.httpMonitorStatusService.getStatus(event.httpMonitorId);

    await this.httpMonitorStatusService.setStatus(event.httpMonitorId, {
      status: newStatus,
      statusCode: event.statusCode.toString(),
    });

    if (previousStatus.status === HttpMonitorStatus.Unknown || previousStatus.status != newStatus) {
      await this.dispatchStatusChangedMessage({
        httpMonitorId: event.httpMonitorId,
        newStatus,
        errorMessage: event.message,
        statusCode: event.statusCode.toString(),
      });
    }
  }

  private computePingStatusFromStatusCode(statusCode: number): HttpMonitorStatus {
    return statusCode >= 200 && statusCode < 400 ? HttpMonitorStatus.Up : HttpMonitorStatus.Down;
  }

  private async dispatchStatusChangedMessage(dto: {
    httpMonitorId: string;
    newStatus: HttpMonitorStatus;
    statusCode?: string;
    errorMessage?: string;
  }) {
    const httpMonitor = await this.httpMonitorReadService.readById(dto.httpMonitorId);

    if (!httpMonitor) {
      return;
    }

    await this.notificationChannelMessagingService.sendHttpMonitorAlertMessage({
      notificationChannelsIds: httpMonitor.notificationChannelsIds,
      httpMonitorId: dto.httpMonitorId,
      newStatus: dto.newStatus,
      name: httpMonitor.name,
      url: httpMonitor.url ?? 'push monitor',
      errorMessage: dto.errorMessage,
      statusCode: dto.statusCode,
    });
  }
}
