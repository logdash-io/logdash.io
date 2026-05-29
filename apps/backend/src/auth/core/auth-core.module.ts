import { Module } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { CustomJwtModule } from '../custom-jwt/custom-jwt.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthEventModule } from '../events/auth-event.module';
import { GithubAuthModule } from '../github/github-auth.module';
import { GoogleAuthModule } from '../google/google-auth.module';
import { PersonalApiKeyAuthModule } from '../../personal-api-key/auth/personal-api-key-auth.module';

@Module({
  imports: [
    GithubAuthModule,
    GoogleAuthModule,
    CustomJwtModule,
    AuthEventModule,
    PersonalApiKeyAuthModule,
  ],
  providers: [AuthGuard, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthCoreModule {}
