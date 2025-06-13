import { Module } from '@nestjs/common';
import { HttpPingBucketWriteService } from './http-ping-bucket-write.service';

@Module({
  providers: [HttpPingBucketWriteService],
  exports: [HttpPingBucketWriteService],
})
export class HttpPingBucketWriteModule {}
