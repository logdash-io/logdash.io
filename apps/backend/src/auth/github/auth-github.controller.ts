import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../core/decorators/is-public';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGithubLoginService } from './auth-github-login.service';
import { ClaimProjectBody } from './dto/claim-project.body';
import { LoginBody } from './dto/login.body';
import { TokenResponse } from '../../shared/responses/token.response';
import { AuthGithubClaimService } from './auth-guthub-claim.service';

@Public()
@Controller('auth/github')
@ApiTags('Auth (github)')
export class AuthGithubController {
  constructor(
    private readonly loginService: AuthGithubLoginService,
    private readonly claimService: AuthGithubClaimService,
  ) {}

  @Post('login')
  @ApiResponse({ type: TokenResponse })
  public async login(@Body() payload: LoginBody): Promise<TokenResponse> {
    return this.loginService.login(payload);
  }

  @Post('claim')
  @ApiResponse({ type: TokenResponse })
  public async claim(
    @Body() payload: ClaimProjectBody,
  ): Promise<TokenResponse> {
    return this.claimService.claimAccount(payload);
  }
}
