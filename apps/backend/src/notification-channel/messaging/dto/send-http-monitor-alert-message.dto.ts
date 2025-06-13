import { HttpMonitorStatus } from '../../../http-monitor/status/enum/http-monitor-status.enum';

export interface SendHttpMonitorAlertMessageDto {
  notificationChannelsIds: string[];
  httpMonitorId: string;
  newStatus: HttpMonitorStatus;
  name: string;
  url: string;
  errorMessage?: string;
  statusCode?: string;
}
