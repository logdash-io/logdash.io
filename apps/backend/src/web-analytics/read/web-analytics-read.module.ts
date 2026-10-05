import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WebAnalyticsSiteEntity,
  WebAnalyticsSiteSchema,
} from '../core/entities/web-analytics-site.entity';
import { WebAnalyticsReadService } from './web-analytics-read.service';
import { LogReadModule } from '../../log/read/log-read.module';
import { ProjectReadModule } from '../../project/read/project-read.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebAnalyticsSiteEntity.name, schema: WebAnalyticsSiteSchema },
    ]),
    LogReadModule,
    ProjectReadModule,
  ],
  providers: [WebAnalyticsReadService],
  exports: [WebAnalyticsReadService],
})
export class WebAnalyticsReadModule {}
