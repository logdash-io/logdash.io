import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TelegramSetupService } from './telegram-setup.service';
import { TelegramChatInfoQuery } from './dto/telegram-chat-info.query';
import { TelegramChatInfoResponse } from './dto/telegram-chat-info.response';
import { Public } from '../../../auth/core/decorators/is-public';
import { TelegramUpdateDto } from './dto/telegram-update.dto';

@ApiTags('Notification channel setup (telegram)')
@Controller('notification_channel_setup/telegram')
export class TelegramSetupController {
  constructor(private readonly telegramApiService: TelegramSetupService) {}

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

  @ApiBearerAuth()
  @Public()
  @Post('bot_webhook')
  public async webhookUpdate(
    @Body() body: TelegramUpdateDto,
    @Headers('X-Telegram-Bot-Api-Secret-Token') secret: string,
  ) {
    console.log('webhookUpdate', body, secret);

    await this.telegramApiService.webhookUpdate(body, secret);
  }
}
