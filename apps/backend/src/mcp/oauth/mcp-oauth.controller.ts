import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/core/decorators/is-public';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import {
  ThrottleAccountCreation,
  ThrottleOauthExchange,
} from '../../shared/throttling/rate-limit.decorator';
import {
  McpOAuthConsentDetails,
  McpOAuthRedirect,
  McpOAuthService,
  McpOAuthTokenResponse,
} from './mcp-oauth.service';

@ApiTags('MCP OAuth')
@Controller()
export class McpOAuthController {
  constructor(private readonly mcpOAuthService: McpOAuthService) {}

  @Public()
  @Get('.well-known/oauth-protected-resource')
  @HttpCode(200)
  public protectedResourceMetadata(): Record<string, unknown> {
    return this.mcpOAuthService.protectedResourceMetadata();
  }

  @Public()
  @Get('.well-known/oauth-protected-resource/mcp')
  @HttpCode(200)
  public protectedResourceMcpMetadata(): Record<string, unknown> {
    return this.mcpOAuthService.protectedResourceMetadata();
  }

  @Public()
  @Get('.well-known/oauth-authorization-server')
  @HttpCode(200)
  public authorizationServerMetadata(): Record<string, unknown> {
    return this.mcpOAuthService.authorizationServerMetadata();
  }

  @Public()
  @Post('oauth/register')
  @ThrottleAccountCreation()
  @HttpCode(201)
  public async register(@Body() body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.mcpOAuthService.registerClient(body);
  }

  @ApiBearerAuth()
  @Post('oauth/authorize/details')
  @HttpCode(200)
  public async details(
    @CurrentUserId() userId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<McpOAuthConsentDetails> {
    return this.mcpOAuthService.startConsent(userId, body);
  }

  @ApiBearerAuth()
  @Post('oauth/authorize/approve')
  @HttpCode(200)
  public async approve(
    @CurrentUserId() userId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<McpOAuthRedirect> {
    return this.mcpOAuthService.approveConsent(userId, body);
  }

  @ApiBearerAuth()
  @Post('oauth/authorize/deny')
  @HttpCode(200)
  public async deny(
    @CurrentUserId() userId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<McpOAuthRedirect> {
    return this.mcpOAuthService.denyConsent(userId, body);
  }

  @Public()
  @Post('oauth/token')
  @ThrottleOauthExchange()
  @HttpCode(200)
  public async token(@Body() body: Record<string, unknown>): Promise<McpOAuthTokenResponse> {
    return this.mcpOAuthService.exchangeToken(body);
  }
}
