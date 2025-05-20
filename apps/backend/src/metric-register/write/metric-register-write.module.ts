import { Module } from '@nestjs/common';
import { MetricRegisterWriteService } from './metric-register-write.service';
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
  providers: [MetricRegisterWriteService],
  exports: [MetricRegisterWriteService],
})
export class MetricRegisterWriteModule {}
