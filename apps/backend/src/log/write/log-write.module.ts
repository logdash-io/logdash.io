import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogEntity, LogSchema } from '../core/entities/log.entity';
import { LogWriteClickhouseService } from './log-write.clickhouse-service';
import { LogWriteService } from './log-write.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: LogEntity.name, schema: LogSchema }])],
  providers: [LogWriteService, LogWriteClickhouseService],
  exports: [LogWriteService, LogWriteClickhouseService],
})
export class LogWriteModule {}
