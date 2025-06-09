import { Module } from '@nestjs/common';
import { HttpMonitorStatusChangeService } from './http-monitor-status-change.service';
import { NotificationsChannelMessagingModule } from '../../notifications-channel/messaging/notifications-channel-messaging.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';

@Module({
  imports: [NotificationsChannelMessagingModule, HttpMonitorReadModule],
  providers: [HttpMonitorStatusChangeService],
  exports: [HttpMonitorStatusChangeService],
})
export class HttpMonitorStatusChangeModule {}
