import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LogMetricEntity,
  LogMetricSchema,
} from '../core/entities/log-metric.entity';
import { LogMetricReadService } from './log-metric-read.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LogMetricEntity.name, schema: LogMetricSchema },
    ]),
  ],
  providers: [LogMetricReadService],
  exports: [LogMetricReadService],
})
export class LogMetricReadModule {}
