import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpPingEntity, HttpPingSchema } from '../core/entities/http-ping.entity';
import { HttpPingReadService } from './http-ping-read.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: HttpPingEntity.name, schema: HttpPingSchema }])],
  providers: [HttpPingReadService],
  exports: [HttpPingReadService],
})
export class HttpPingReadModule {}
