import { Module } from '@nestjs/common';
import { ProjectMemberGuard } from './project-member.guard';
import { ProjectReadModule } from '../../read/project-read.module';

@Module({
  imports: [ProjectReadModule],
  providers: [ProjectMemberGuard],
  exports: [ProjectMemberGuard],
})
export class ProjectMemberGuardModule {}
