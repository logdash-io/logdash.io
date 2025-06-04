import { Module } from '@nestjs/common';
import { GithubAuthLoginService } from './github-auth-login.service';
import { UserReadModule } from '../../user/read/user-read.module';
import { UserWriteModule } from '../../user/write/user-write.module';
import { CustomJwtModule } from '../custom-jwt/custom-jwt.module';
import { GithubAuthController } from './github-auth.controller';
import { ProjectLimitModule } from '../../project/limit/project-limit-module';
import { GithubAuthDataService } from './github-auth-data.service';
import { GithubAuthClaimService } from './github-auth-claim.service';
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
  controllers: [GithubAuthController],
  providers: [GithubAuthLoginService, GithubAuthClaimService, GithubAuthDataService],
})
export class GithubAuthModule {}
