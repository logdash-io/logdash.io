import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WebAnalyticsSiteEntity,
  WebAnalyticsSiteSchema,
} from '../core/entities/web-analytics-site.entity';
import { WebAnalyticsWriteService } from './web-analytics-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebAnalyticsSiteEntity.name, schema: WebAnalyticsSiteSchema },
    ]),
  ],
  providers: [WebAnalyticsWriteService],
  exports: [WebAnalyticsWriteService],
})
export class WebAnalyticsWriteModule {}
