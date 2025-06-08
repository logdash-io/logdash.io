import { Module } from '@nestjs/common';
import { HttpPingReadService } from './http-ping-read.service';

@Module({
  providers: [HttpPingReadService],
  exports: [HttpPingReadService],
})
export class HttpPingReadModule {}
