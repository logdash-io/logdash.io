import { Module } from '@nestjs/common';
import { GoogleAuthLoginService } from './google-auth-login.service';
import { UserReadModule } from '../../user/read/user-read.module';
import { UserWriteModule } from '../../user/write/user-write.module';
import { CustomJwtModule } from '../custom-jwt/custom-jwt.module';
import { GoogleAuthController } from './google-auth.controller';
import { ProjectLimitModule } from '../../project/limit/project-limit-module';
import { GoogleAuthDataService } from './google-auth-data.service';
import { GoogleAuthClaimService } from './google-auth-claim.service';
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
  controllers: [GoogleAuthController],
  providers: [GoogleAuthLoginService, GoogleAuthClaimService, GoogleAuthDataService],
})
export class GoogleAuthModule {}
