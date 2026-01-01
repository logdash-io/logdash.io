import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpMonitorEntity, HttpMonitorSchema } from '../core/entities/http-monitor.entity';
import { HttpMonitorWriteService } from './http-monitor-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HttpMonitorEntity.name, schema: HttpMonitorSchema }]),
  ],
  providers: [HttpMonitorWriteService],
  exports: [HttpMonitorWriteService],
})
export class HttpMonitorWriteModule {}
