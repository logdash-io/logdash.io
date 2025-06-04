import { Module } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { CustomJwtModule } from '../custom-jwt/custom-jwt.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthEventModule } from '../events/auth-event.module';
import { GithubAuthModule } from '../github/github-auth.module';
import { ApiKeyAuthModule } from '../api-key/api-key-auth.module';

@Module({
  imports: [GithubAuthModule, CustomJwtModule, AuthEventModule, ApiKeyAuthModule],
  providers: [AuthGuard, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthCoreModule {}
