import { Module } from '@nestjs/common';
import { TelegramSetupController } from './telegram-setup.controller';
import { TelegramSetupService } from './telegram-setup.service';

@Module({
  controllers: [TelegramSetupController],
  providers: [TelegramSetupService],
})
export class TelegramSetupModule {}
