import { Module } from '@nestjs/common';
import { TelegramSetupController } from './telegram-setup.controller';
import { TelegramSetupService } from './telegram-setup.service';
import { TelegramTestMessageService } from './telegram-test-message.service';

@Module({
  controllers: [TelegramSetupController],
  providers: [TelegramSetupService, TelegramTestMessageService],
})
export class TelegramSetupModule {}
