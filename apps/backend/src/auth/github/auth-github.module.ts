import { Module } from '@nestjs/common';
import { AuthGithubLoginService } from './auth-github-login.service';
import { UserReadModule } from '../../user/read/user-read.module';
import { UserWriteModule } from '../../user/write/user-write.module';
import { CustomJwtModule } from '../custom-jwt/custom-jwt.module';
import { AuthGithubController } from './auth-github.controller';
import { ProjectLimitModule } from '../../project/limit/project-limit-module';
import { AuthGithubDataService } from './auth-github-data.service';
import { AuthGithubClaimService } from './auth-guthub-claim.service';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { ClusterWriteModule } from '../../cluster/write/cluster-write.module';

@Module({
  imports: [
    UserReadModule,
    UserWriteModule,
    CustomJwtModule,
    ProjectLimitModule,
    ClusterReadModule,
    ClusterWriteModule,
  ],
  controllers: [AuthGithubController],
  providers: [
    AuthGithubLoginService,
    AuthGithubClaimService,
    AuthGithubDataService,
  ],
})
export class AuthGithubModule {}
