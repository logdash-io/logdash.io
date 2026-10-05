import { Module } from '@nestjs/common';
import { NotificationChannelDefaultsService } from './notification-channel-defaults.service';
import { HttpMonitorReadModule } from '../../http-monitor/read/http-monitor-read.module';
import { HttpMonitorWriteModule } from '../../http-monitor/write/http-monitor-write.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { NotificationChannelReadModule } from '../read/notification-channel-read.module';
import { NotificationChannelWriteModule } from '../write/notification-channel-write.module';

@Module({
  imports: [
    HttpMonitorReadModule,
    HttpMonitorWriteModule,
    ProjectReadModule,
    ClusterReadModule,
    UserReadModule,
    NotificationChannelReadModule,
    NotificationChannelWriteModule,
  ],
  providers: [NotificationChannelDefaultsService],
  exports: [NotificationChannelDefaultsService],
})
export class NotificationChannelDefaultsModule {}
