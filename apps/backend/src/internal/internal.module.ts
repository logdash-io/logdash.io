import { Module } from '@nestjs/common';
import { TelegramInternalModule } from './telegram/telegram-internal.module';
import { UserReadModule } from '../user/read/user-read.module';
import { FeedbackController } from './feedback/feedback.controller';

@Module({
  imports: [TelegramInternalModule, UserReadModule],
  controllers: [FeedbackController],
})
export class InternalModule {}
