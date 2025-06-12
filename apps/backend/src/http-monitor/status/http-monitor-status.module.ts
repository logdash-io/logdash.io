import { Module } from '@nestjs/common';
import { HttpMonitorStatusChangeService } from './http-monitor-status-change.service';
import { NotificationChannelMessagingModule } from '../../notification-channel/messaging/notification-channel-messaging.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorStatusService } from './http-monitor-status.service';

@Module({
  imports: [NotificationChannelMessagingModule, HttpMonitorReadModule],
  providers: [HttpMonitorStatusChangeService, HttpMonitorStatusService],
  exports: [HttpMonitorStatusChangeService, HttpMonitorStatusService],
})
export class HttpMonitorStatusModule {}
