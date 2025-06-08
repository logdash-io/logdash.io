import { Module } from '@nestjs/common';
import { UserReadModule } from '../../user/read/user-read.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorLimitService } from './http-monitor-limit.service';
import { ProjectReadModule } from '../../project/read/project-read.module';

@Module({
  imports: [UserReadModule, HttpMonitorReadModule, ProjectReadModule],
  providers: [HttpMonitorLimitService],
  exports: [HttpMonitorLimitService],
})
export class HttpMonitorLimitModule {}
