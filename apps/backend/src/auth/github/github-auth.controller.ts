import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../core/decorators/is-public';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GithubAuthLoginService } from './github-auth-login.service';
import { GithubClaimProjectBody } from './dto/github-claim-project.body';
import { GithubLoginBody } from './dto/github-login.body';
import { TokenResponse } from '../../shared/responses/token.response';
import { GithubAuthClaimService } from './github-auth-claim.service';

@Public()
@Controller('auth/github')
@ApiTags('Auth (github)')
export class GithubAuthController {
  constructor(
    private readonly loginService: GithubAuthLoginService,
    private readonly claimService: GithubAuthClaimService,
  ) {}

  @Post('login')
  @ApiResponse({ type: TokenResponse })
  public async login(@Body() payload: GithubLoginBody): Promise<TokenResponse> {
    return this.loginService.login(payload);
  }

  @Post('claim')
  @ApiResponse({ type: TokenResponse })
  public async claim(@Body() payload: GithubClaimProjectBody): Promise<TokenResponse> {
    return this.claimService.claimAccount(payload);
  }
}
