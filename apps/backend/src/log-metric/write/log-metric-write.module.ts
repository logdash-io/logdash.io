import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LogMetricEntity,
  LogMetricSchema,
} from '../core/entities/log-metric.entity';
import { LogMetricWriteService } from './log-metric-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LogMetricEntity.name, schema: LogMetricSchema },
    ]),
  ],
  providers: [LogMetricWriteService],
  exports: [LogMetricWriteService],
})
export class LogMetricWriteModule {}
