import { Module } from '@nestjs/common';
import { StatusPageCompositionModule } from '../composition/status-page-composition.module';
import { StatusPageCoreController } from './status-page-core.controller';

@Module({
  imports: [StatusPageCompositionModule],
  controllers: [StatusPageCoreController],
})
export class StatusPageCoreModule {}
