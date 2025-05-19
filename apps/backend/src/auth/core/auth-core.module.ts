import { Module } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { CustomJwtModule } from '../custom-jwt/custom-jwt.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthEventModule } from '../events/auth-event.module';
import { AuthGithubModule } from '../github/auth-github.module';

@Module({
  imports: [AuthGithubModule, CustomJwtModule, AuthEventModule],
  providers: [AuthGuard, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthCoreModule {}
