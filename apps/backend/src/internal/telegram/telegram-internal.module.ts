import { Module } from '@nestjs/common';
import { TelegramInternalService } from './telegram-internal.service';

@Module({
  providers: [TelegramInternalService],
  exports: [TelegramInternalService],
})
export class TelegramInternalModule {}
