import { Module } from '@nestjs/common';
import { MetricEntity, MetricSchema } from '../core/entities/metric.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricWriteService } from './metric-write.service';
import { MetricWriteClickhouseService } from './metric-write.clickhouse-service';

@Module({
  imports: [MongooseModule.forFeature([{ name: MetricEntity.name, schema: MetricSchema }])],
  providers: [MetricWriteService, MetricWriteClickhouseService],
  exports: [MetricWriteService, MetricWriteClickhouseService],
})
export class MetricWriteModule {}
