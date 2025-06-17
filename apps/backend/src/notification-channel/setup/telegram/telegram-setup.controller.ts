import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TelegramSetupService } from './telegram-setup.service';
import { TelegramChatInfoQuery } from './dto/telegram-chat-info.query';
import { TelegramChatInfoResponse } from './dto/telegram-chat-info.response';
import { Public } from '../../../auth/core/decorators/is-public';
import { TelegramUpdateDto } from './dto/telegram-update.dto';
import { TelegramTestMessageBody } from './dto/telegram-test-message.body';
import { TelegramTestMessageService } from './telegram-test-message.service';
import { CurrentUserId } from '../../../auth/core/decorators/current-user-id.decorator';

@ApiTags('Notification channel setup (telegram)')
@Controller('notification_channel_setup/telegram')
export class TelegramSetupController {
  constructor(
    private readonly telegramApiService: TelegramSetupService,
    private readonly telegramTestMessageService: TelegramTestMessageService,
  ) {}

  @ApiBearerAuth()
  @Get('chat_info')
  @ApiResponse({ type: TelegramChatInfoResponse })
  public async fetchChats(
    @Query() query: TelegramChatInfoQuery,
  ): Promise<TelegramChatInfoResponse> {
    const chatInfo = await this.telegramApiService.getChatInfoForPassphrase(query.passphrase);

    if (!chatInfo) {
      return { success: false };
    }

    return { success: true, chatId: chatInfo.id, name: chatInfo.name };
  }

  @Public()
  @Post('bot_webhook')
  public async webhookUpdate(
    @Body() body: TelegramUpdateDto,
    @Headers('X-Telegram-Bot-Api-Secret-Token') secret: string,
  ): Promise<void> {
    await this.telegramApiService.webhookUpdate(body, secret);
  }

  @ApiBearerAuth()
  @Post('send_test_message')
  public async sendTestMessage(
    @Body() body: TelegramTestMessageBody,
    @CurrentUserId() userId: string,
  ): Promise<void> {
    await this.telegramTestMessageService.sendTestMessage(userId, body.chatId, body.message);
  }
}
