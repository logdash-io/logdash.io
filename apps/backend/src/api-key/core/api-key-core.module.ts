import { Module } from '@nestjs/common';
import { ApiKeyCoreController } from './api-key-core.controller';
import { ApiKeyWriteModule } from '../write/api-key-write.module';
import { UserWriteModule } from '../../user/write/user-write.module';
import { ProjectWriteModule } from '../../project/write/project-write.module';
import { ApiKeyReadModule } from '../read/api-key-read.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';

@Module({
  imports: [
    ApiKeyWriteModule,
    UserWriteModule,
    ProjectWriteModule,
    ApiKeyReadModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [ApiKeyCoreController],
  providers: [],
})
export class ApiKeyCoreModule {}
