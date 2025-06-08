import { Module } from '@nestjs/common';
import { HttpPingWriteService } from './http-ping-write.service';

@Module({
  providers: [HttpPingWriteService],
  exports: [HttpPingWriteService],
})
export class HttpPingWriteModule {}
