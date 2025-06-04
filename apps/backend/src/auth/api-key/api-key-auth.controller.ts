import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ApiKeyAuthService } from './api-key-auth.service';
import { ApiKeyAuthRequestDto } from './dto/api-key-auth-request.dto';
import { Public } from '../core/decorators/is-public';
import { TokenResponse } from '../../shared/responses/token.response';

@Public()
@Controller('auth/api-key')
@ApiTags('Auth (API key)')
export class ApiKeyAuthController {
  constructor(private readonly apiKeyAuthService: ApiKeyAuthService) {}

  @Post()
  @ApiResponse({ type: TokenResponse })
  public async authenticate(@Body() body: ApiKeyAuthRequestDto): Promise<TokenResponse> {
    const token = await this.apiKeyAuthService.authenticateWithApiKey(body.apiKey);

    return { token };
  }
}
