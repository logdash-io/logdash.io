import { Module } from '@nestjs/common';
import { BadgeCompositionModule } from '../composition/badge-composition.module';
import { BadgeCoreController } from './badge-core.controller';

@Module({
  imports: [BadgeCompositionModule],
  controllers: [BadgeCoreController],
})
export class BadgeCoreModule {}
