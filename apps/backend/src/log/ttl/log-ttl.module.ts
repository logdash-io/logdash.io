import { Module } from '@nestjs/common';
import { LogTtlService } from './log-ttl.service';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ProjectWriteModule } from '../../project/write/project-write.module';
import { LogWriteModule } from '../write/log-write.module';

@Module({
  imports: [ProjectReadModule, ProjectWriteModule, LogWriteModule],
  providers: [LogTtlService],
})
export class LogTtlModule {}
