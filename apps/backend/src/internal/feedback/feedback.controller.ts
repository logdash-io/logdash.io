import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { ThrottleFeedback } from '../../shared/throttling/rate-limit.decorator';
import { UserReadService } from '../../user/read/user-read.service';
import { TelegramInternalService } from '../telegram/telegram-internal.service';
import { SendFeedbackBody } from './send-feedback.body';

@Controller('feedback')
@ApiTags('Feedback')
@ApiBearerAuth()
export class FeedbackController {
  constructor(
    private readonly userReadService: UserReadService,
    private readonly telegramInternalService: TelegramInternalService,
  ) {}

  @Post()
  @HttpCode(204)
  @ThrottleFeedback()
  public async sendFeedback(
    @Body() dto: SendFeedbackBody,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    const user = await this.userReadService.readByIdOrThrow(userId);

    await this.telegramInternalService.sendFeedback({ ...dto, email: user.email });
  }
}
