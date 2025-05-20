import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  HttpPingEntity,
  HttpPingSchema,
} from '../core/entities/http-ping.entity';
import { HttpPingWriteService } from './http-ping-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HttpPingEntity.name, schema: HttpPingSchema },
    ]),
  ],
  providers: [HttpPingWriteService],
  exports: [HttpPingWriteService],
})
export class HttpPingWriteModule {}
