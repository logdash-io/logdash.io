import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ApiKeyAuthService } from './api-key-auth.service';
import { ApiKeyAuthBody } from './dto/api-key-auth.body';
import { Public } from '../core/decorators/is-public';
import { ApiKeyAuthResponse } from './dto/api-key-auth.response';

@Public()
@Controller('auth/api-key')
@ApiTags('Auth (API key)')
export class ApiKeyAuthController {
  constructor(private readonly apiKeyAuthService: ApiKeyAuthService) {}

  @Post()
  @ApiResponse({ type: ApiKeyAuthResponse })
  public async authenticate(@Body() body: ApiKeyAuthBody): Promise<ApiKeyAuthResponse> {
    return await this.apiKeyAuthService.authenticateWithApiKey(body.apiKey);
  }
}
