import { Controller, Get } from '@nestjs/common';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { SupportCoreService } from './support-core.service';
import { UrlResponse } from '../../shared/responses/url.response';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Support')
@Controller('support')
export class SupportCoreController {
  constructor(private readonly service: SupportCoreService) {}

  @ApiResponse({ type: UrlResponse })
  @Get('telegram/invite-link')
  public async getTelegramSupportInviteLink(
    @CurrentUserId() userId: string,
  ): Promise<UrlResponse> {
    return {
      url: await this.service.getTelegramSupportInviteLink(userId),
    };
  }
}
