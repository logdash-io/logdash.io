import { Module } from '@nestjs/common';
import { PersonalApiKeyWriteModule } from '../../personal-api-key/write/personal-api-key-write.module';
import { McpOAuthController } from './mcp-oauth.controller';
import { McpOAuthService } from './mcp-oauth.service';
import { McpOAuthStoreService } from './mcp-oauth-store.service';

@Module({
  imports: [PersonalApiKeyWriteModule],
  controllers: [McpOAuthController],
  providers: [McpOAuthService, McpOAuthStoreService],
})
export class McpOAuthModule {}
