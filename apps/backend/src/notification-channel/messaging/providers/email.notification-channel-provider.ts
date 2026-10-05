import { Inject, Injectable } from '@nestjs/common';
import {
  NotificationChannelProvider,
  SendHttpMonitorAlertMessageSpecificProviderDto,
} from '../notification-channel-provider';
import { EmailOptions } from '../../core/types/email-options.type';
import { HttpMonitorStatus } from '../../../http-monitor/status/enum/http-monitor-status.enum';
import { ResendTemplatedEmailsService } from '../../../email/resend/resend-templated-emails.service';
import { getEnvConfig } from '../../../shared/configs/env-configs';
import { LogdashLogger } from '../../../shared/logdash/aggregate-logger';
import { NOTIFICATIONS_LOGGER } from '../../../shared/logdash/logdash-tokens';
import { errorMessage } from '../../../shared/utils/error-message';

@Injectable()
export class EmailNotificationChannelProvider implements NotificationChannelProvider {
  constructor(
    private readonly resendTemplatedEmailsService: ResendTemplatedEmailsService,
    @Inject(NOTIFICATIONS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  public async sendHttpMonitorAlertMessage(
    dto: SendHttpMonitorAlertMessageSpecificProviderDto,
  ): Promise<void> {
    if (!getEnvConfig().resend.enabled) {
      return;
    }

    const options = dto.notificationChannel.options as EmailOptions;

    try {
      await this.resendTemplatedEmailsService.sendHttpMonitorAlertEmail(options.email, {
        name: dto.name,
        url: dto.url,
        up: dto.newStatus === HttpMonitorStatus.Up,
        statusCode: dto.statusCode,
        errorMessage: dto.errorMessage,
        dashboardUrl: `${getEnvConfig().app.url}/app/domains/${dto.notificationChannel.clusterId}`,
      });
    } catch (error) {
      this.logger.error('Failed to send alert email', { error: errorMessage(error) });
    }
  }

  public sendWelcomeMessage(): Promise<void> {
    return Promise.resolve();
  }
}
