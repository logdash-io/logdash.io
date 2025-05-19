import { Module } from '@nestjs/common';
import { ApiKeyCoreController } from './api-key-core.controller';
import { ApiKeyWriteModule } from '../write/api-key-write.module';
import { UserWriteModule } from '../../user/write/user-write.module';
import { ProjectWriteModule } from '../../project/write/project-write.module';
import { ProjectReadModule } from '../../project/read/project-read.module';
import { ApiKeyReadModule } from '../read/api-key-read.module';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';

@Module({
  imports: [
    ApiKeyWriteModule,
    UserWriteModule,
    ProjectWriteModule,
    ProjectReadModule,
    ApiKeyReadModule,
    ClusterReadModule,
  ],
  controllers: [ApiKeyCoreController],
  providers: [],
})
export class ApiKeyCoreModule {}
