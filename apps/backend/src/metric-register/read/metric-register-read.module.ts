import { Module } from '@nestjs/common';
import { MetricRegisterReadService } from './metric-register-read.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MetricRegisterEntryEntity,
  MetricRegisterEntrySchema,
} from '../core/entities/metric-register-entry.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MetricRegisterEntryEntity.name,
        schema: MetricRegisterEntrySchema,
      },
    ]),
  ],
  providers: [MetricRegisterReadService],
  exports: [MetricRegisterReadService],
})
export class MetricRegisterReadModule {}
