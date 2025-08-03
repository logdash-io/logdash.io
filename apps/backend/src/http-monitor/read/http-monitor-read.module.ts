import { Module } from '@nestjs/common';
import { HttpMonitorReadService } from './http-monitor-read.service';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpMonitorEntity, HttpMonitorSchema } from '../core/entities/http-monitor.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HttpMonitorEntity.name, schema: HttpMonitorSchema }]),
  ],
  providers: [HttpMonitorReadService],
  exports: [HttpMonitorReadService],
})
export class HttpMonitorReadModule {}
