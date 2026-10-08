import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpPingEvent } from '../../http-ping/events/http-ping-event.enum';
import { HttpPingCreatedEvent } from '../../http-ping/events/definitions/http-ping-created.event';
import { HttpMonitorStatus } from './enum/http-monitor-status.enum';
import { NotificationChannelMessagingService } from '../../notification-channel/messaging/notification-channel-messaging.service';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { HttpMonitorStatusService } from './http-monitor-status.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { HTTP_MONITORS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { errorMessage } from '../../shared/utils/error-message';
import { FAILED_PINGS_TO_CONFIRM_DOWN, isHealthy } from '../../http-ping/core/get-monitor-status';

@Injectable()
export class HttpMonitorStatusChangeService {
  constructor(
    private readonly notificationChannelMessagingService: NotificationChannelMessagingService,
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpMonitorStatusService: HttpMonitorStatusService,
    @Inject(HTTP_MONITORS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  @OnEvent(HttpPingEvent.HttpPingCreatedEvent)
  public async tryHandleHttpPingCreatedEvent(event: HttpPingCreatedEvent): Promise<void> {
    try {
      await this.handleHttpPingCreatedEvent(event);
    } catch (error) {
      this.logger.error('Error handling http ping created event', {
        error: errorMessage(error),
        event,
      });
    }
  }

  public async handleHttpPingCreatedEvent(event: HttpPingCreatedEvent): Promise<void> {
    const newStatus = isHealthy(event.statusCode) ? HttpMonitorStatus.Up : HttpMonitorStatus.Down;
    const previous = await this.httpMonitorStatusService.getStatus(event.httpMonitorId);
    const notifiedStatus = previous.notifiedStatus ?? previous.status;
    const consecutiveFailures =
      newStatus === HttpMonitorStatus.Down ? (previous.consecutiveFailures ?? 0) + 1 : 0;
    const confirmedStatus =
      newStatus === HttpMonitorStatus.Up || consecutiveFailures >= FAILED_PINGS_TO_CONFIRM_DOWN
        ? newStatus
        : notifiedStatus;

    await this.httpMonitorStatusService.setStatus(event.httpMonitorId, {
      status: newStatus,
      statusCode: event.statusCode.toString(),
      consecutiveFailures,
      notifiedStatus: confirmedStatus,
    });

    const details = {
      httpMonitorId: event.httpMonitorId,
      statusCode: event.statusCode,
      consecutiveFailures,
    };

    if (confirmedStatus !== notifiedStatus) {
      this.logger.info(`Http monitor is ${confirmedStatus}, sending alert`, details);
      await this.dispatchStatusChangedMessage({
        httpMonitorId: event.httpMonitorId,
        newStatus: confirmedStatus,
        errorMessage: event.message,
        statusCode: event.statusCode.toString(),
      });
      return;
    }

    if (consecutiveFailures === 1) {
      this.logger.info(
        'Http monitor ping failed, alert held until the next ping confirms it',
        details,
      );
    }

    if (newStatus === HttpMonitorStatus.Up && (previous.consecutiveFailures ?? 0) > 0) {
      this.logger.info('Http monitor recovered before the failure was confirmed', details);
    }
  }

  private async dispatchStatusChangedMessage(dto: {
    httpMonitorId: string;
    newStatus: HttpMonitorStatus;
    statusCode?: string;
    errorMessage?: string;
  }): Promise<void> {
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
