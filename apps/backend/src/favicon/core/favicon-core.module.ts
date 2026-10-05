import { Module } from '@nestjs/common';
import { FaviconCoreController } from './favicon-core.controller';
import { FaviconService } from './favicon.service';

@Module({
  controllers: [FaviconCoreController],
  providers: [FaviconService],
})
export class FaviconCoreModule {}
