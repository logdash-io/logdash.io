import { Module } from '@nestjs/common';
import { HttpPingBucketWriteModule } from '../../http-ping-bucket/write/http-ping-bucket-write.module';
import { HttpPingBucketTtlService } from './http-ping-bucket-ttl.service';

@Module({
  imports: [HttpPingBucketWriteModule],
  providers: [HttpPingBucketTtlService],
})
export class HttpPingBucketTtlModule {}
