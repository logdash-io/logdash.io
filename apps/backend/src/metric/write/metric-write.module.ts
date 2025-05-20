import { Module } from '@nestjs/common';
import { MetricEntity, MetricSchema } from '../core/entities/metric.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricWriteService } from './metric-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MetricEntity.name, schema: MetricSchema },
    ]),
  ],
  providers: [MetricWriteService],
  exports: [MetricWriteService],
})
export class MetricWriteModule {}
