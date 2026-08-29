import { Body, Controller, Headers, HttpCode, Ip, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { Public } from '../../auth/core/decorators/is-public';
import {
  ThrottleAccountCreation,
  ThrottleCliPolling,
} from '../../shared/throttling/rate-limit.decorator';
import { ApproveCliAuthBody } from './dto/approve-cli-auth.body';
import { DenyCliAuthBody } from './dto/deny-cli-auth.body';
import { LookupCliAuthBody } from './dto/lookup-cli-auth.body';
import { PollCliAuthBody } from './dto/poll-cli-auth.body';
import {
  CliAuthApproveResult,
  CliAuthPollResult,
  CliAuthService,
  CliAuthStartResult,
} from './cli-auth.service';
import { CliAuthRequestDetails } from './cli-auth.types';

@Controller('auth/cli')
@ApiTags('CLI authorization')
export class CliAuthController {
  constructor(private readonly cliAuthService: CliAuthService) {}

  /**
   * Public: the CLI calls this first to obtain the deviceCode (secret it polls
   * with) and the userCode (which the human transcribes into the consent screen).
   *
   * The request is bound to its origin so the consent screen can show who asked.
   * `@Ip()` resolves through express `trust proxy` (set in main.ts); we never read
   * `x-forwarded-for` by hand, because a forgeable "requesting machine" on the
   * consent screen is worse than showing none at all.
   */
  @Post('start')
  @Public()
  @ThrottleAccountCreation()
  @HttpCode(201)
  public async start(
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<CliAuthStartResult> {
    return this.cliAuthService.start({ clientIp: ip, clientUserAgent: userAgent });
  }

  /**
   * Session-JWT-gated. Resolves a user-typed code to the details of the machine
   * that started the request, so the consent screen can render them before the
   * user grants anything. Shares the approve brute-force budget.
   */
  @Post('lookup')
  @ApiBearerAuth()
  @HttpCode(200)
  public async lookup(
    @CurrentUserId() userId: string,
    @Body() body: LookupCliAuthBody,
  ): Promise<CliAuthRequestDetails> {
    return this.cliAuthService.lookup({ userId, userCode: body.userCode });
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
  @ThrottleCliPolling()
  @HttpCode(200)
  public async poll(@Body() body: PollCliAuthBody): Promise<CliAuthPollResult> {
    return this.cliAuthService.poll(body.deviceCode);
  }
}
