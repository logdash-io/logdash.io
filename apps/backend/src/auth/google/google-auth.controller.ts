import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../core/decorators/is-public';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoogleAuthLoginService } from './google-auth-login.service';
import { GoogleClaimProjectBody } from './dto/google-claim-project.body';
import { GoogleLoginBody } from './dto/google-login.body';
import { TokenResponse } from '../../shared/responses/token.response';
import { GoogleAuthClaimService } from './google-auth-claim.service';

@Public()
@Controller('auth/google')
@ApiTags('Auth (google)')
export class GoogleAuthController {
  constructor(
    private readonly loginService: GoogleAuthLoginService,
    private readonly claimService: GoogleAuthClaimService,
  ) {}

  @Post('login')
  @ApiResponse({ type: TokenResponse })
  public async login(@Body() payload: GoogleLoginBody): Promise<TokenResponse> {
    return this.loginService.login(payload);
  }

  @Post('claim')
  @ApiResponse({ type: TokenResponse })
  public async claim(@Body() payload: GoogleClaimProjectBody): Promise<TokenResponse> {
    return this.claimService.claimAccount(payload);
  }
}
