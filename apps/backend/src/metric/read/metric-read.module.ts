import { Module } from '@nestjs/common';
import { MetricEntity, MetricSchema } from '../core/entities/metric.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricReadService } from './metric-read.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MetricEntity.name, schema: MetricSchema },
    ]),
  ],
  providers: [MetricReadService],
  exports: [MetricReadService],
})
export class MetricReadModule {}
