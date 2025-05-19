import { Module } from '@nestjs/common';
import { LogIndexingService } from './log-indexing.service';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ProjectWriteModule } from '../../project/write/project-write.module';

@Module({
  imports: [ProjectReadModule, ProjectWriteModule],
  providers: [LogIndexingService],
  exports: [LogIndexingService],
})
export class LogIndexingModule {}
