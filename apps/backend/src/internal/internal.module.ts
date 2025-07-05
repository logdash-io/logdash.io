import { Module } from '@nestjs/common';
import { TelegramInternalModule } from './telegram/telegram-internal.module';

@Module({
  imports: [TelegramInternalModule],
})
export class InternalModule {}
