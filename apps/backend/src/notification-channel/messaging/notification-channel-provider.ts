import { HttpMonitorStatus } from '../../http-monitor/status/enum/http-monitor-status.enum';
import { NotificationChannelNormalized } from '../core/entities/notification-channel.interface';

export interface SendHttpMonitorAlertMessageSpecificProviderDto {
  notificationChannel: NotificationChannelNormalized;
  httpMonitorId: string;
  newStatus: HttpMonitorStatus;
  name: string;
  url: string;
  errorMessage?: string;
  statusCode?: string;
}

export interface NotificationChannelProvider {
  sendHttpMonitorAlertMessage(dto: SendHttpMonitorAlertMessageSpecificProviderDto): Promise<void>;
}
