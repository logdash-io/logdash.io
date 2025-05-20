import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogEntity, LogSchema } from '../core/entities/log.entity';
import { LogWriteService } from './log-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LogEntity.name, schema: LogSchema }]),
  ],
  providers: [LogWriteService],
  exports: [LogWriteService],
})
export class LogWriteModule {}
