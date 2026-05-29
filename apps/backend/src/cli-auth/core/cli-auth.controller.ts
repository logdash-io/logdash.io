import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { Public } from '../../auth/core/decorators/is-public';
import { ApproveCliAuthBody } from './dto/approve-cli-auth.body';
import { DenyCliAuthBody } from './dto/deny-cli-auth.body';
import { PollCliAuthBody } from './dto/poll-cli-auth.body';
import {
  CliAuthApproveResult,
  CliAuthPollResult,
  CliAuthService,
  CliAuthStartResult,
} from './cli-auth.service';

@Controller('auth/cli')
@ApiTags('CLI authorization')
export class CliAuthController {
  constructor(private readonly cliAuthService: CliAuthService) {}

  /**
   * Public: the CLI calls this first to obtain the deviceCode (secret it polls
   * with) and the userCode (glanceable handle for the magic link).
   */
  @Post('start')
  @Public()
  @HttpCode(201)
  public async start(): Promise<CliAuthStartResult> {
    return this.cliAuthService.start();
  }

  /**
   * Session-JWT-gated (default guard, no @Public, no @RequireScope). A personal
   * API key hitting this is fail-closed -> 403, keeping key-management session-only
   * (ADR-0002/0003). Mints a personal key owned by the session user.
   */
  @Post('approve')
  @ApiBearerAuth()
  @HttpCode(200)
  public async approve(
    @CurrentUserId() userId: string,
    @Body() body: ApproveCliAuthBody,
  ): Promise<CliAuthApproveResult> {
    return this.cliAuthService.approve({
      userId,
      userCode: body.userCode,
      scopes: body.scopes,
      access: body.access,
    });
  }

  /**
   * Session-JWT-gated. The user declines the request; the record is marked denied
   * and the CLI's next poll returns denied (value never minted).
   */
  @Post('deny')
  @ApiBearerAuth()
  @HttpCode(200)
  public async deny(
    @CurrentUserId() userId: string,
    @Body() body: DenyCliAuthBody,
  ): Promise<{ status: 'denied' }> {
    return this.cliAuthService.deny({ userId, userCode: body.userCode });
  }

  /**
   * Public, authed by possession of the deviceCode. Returns the minted value
   * exactly once (then destroys the record). The userCode can NEVER retrieve a value.
   */
  @Post('poll')
  @Public()
  @HttpCode(200)
  public async poll(@Body() body: PollCliAuthBody): Promise<CliAuthPollResult> {
    return this.cliAuthService.poll(body.deviceCode);
  }
}
