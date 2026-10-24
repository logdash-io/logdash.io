import { Module } from '@nestjs/common';
import { ApiKeyReadModule } from '../../api-key/read/api-key-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { UserReadModule } from '../../user/read/user-read.module';
import { ProjectLimitModule } from '../limit/project-limit-module';
import { ProjectReadModule } from '../read/project-read.module';
import { ProjectWriteModule } from '../write/project-write.module';
import { IngestProjectService } from './ingest-project.service';

@Module({
  imports: [
    ApiKeyReadModule,
    ClusterReadModule,
    UserReadModule,
    ProjectLimitModule,
    ProjectReadModule,
    ProjectWriteModule,
  ],
  providers: [IngestProjectService],
  exports: [IngestProjectService],
})
export class IngestProjectModule {}
