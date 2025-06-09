import { Module } from '@nestjs/common';
import { HttpMonitorStatusChangeService } from './http-monitor-status-change.service';
import { NotificationChannelMessagingModule } from '../../notification-channel/messaging/notification-channel-messaging.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';

@Module({
  imports: [NotificationChannelMessagingModule, HttpMonitorReadModule],
  providers: [HttpMonitorStatusChangeService],
  exports: [HttpMonitorStatusChangeService],
})
export class HttpMonitorStatusChangeModule {}
