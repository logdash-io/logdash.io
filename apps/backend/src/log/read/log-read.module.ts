import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogEntity, LogSchema } from '../core/entities/log.entity';
import { LogReadService } from './log-read.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LogEntity.name, schema: LogSchema }]),
  ],
  providers: [LogReadService],
  exports: [LogReadService],
})
export class LogReadModule {}
