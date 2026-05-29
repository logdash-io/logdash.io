import { Module } from '@nestjs/common';
import { PersonalApiKeyWriteModule } from '../../personal-api-key/write/personal-api-key-write.module';
import { CliAuthController } from './cli-auth.controller';
import { CliAuthService } from './cli-auth.service';
import { CliAuthStoreService } from './cli-auth-store.service';

@Module({
  imports: [PersonalApiKeyWriteModule],
  controllers: [CliAuthController],
  providers: [CliAuthService, CliAuthStoreService],
  exports: [CliAuthService],
})
export class CliAuthModule {}
