import { Module } from '@nestjs/common';
import { ProjectLimitService } from './project-limit-service';
import { ProjectReadModule } from '../read/project-read.module';
import { UserReadModule } from '../../user/read/user-read.module';

@Module({
  imports: [ProjectReadModule, UserReadModule],
  providers: [ProjectLimitService],
  exports: [ProjectLimitService],
})
export class ProjectLimitModule {}
