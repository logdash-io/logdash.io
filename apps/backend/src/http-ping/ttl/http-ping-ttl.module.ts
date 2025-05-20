import { Module } from '@nestjs/common';
import { HttpPingWriteModule } from '../write/http-ping-write.module';
import { HttpPingTtlService } from './http-ping-ttl.service';

@Module({
  imports: [HttpPingWriteModule],
  providers: [HttpPingTtlService],
})
export class HttpPingTtlModule {}
