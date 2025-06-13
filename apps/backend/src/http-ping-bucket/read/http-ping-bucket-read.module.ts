import { Module } from '@nestjs/common';
import { HttpPingBucketReadService } from './http-ping-bucket-read.service';

@Module({
  providers: [HttpPingBucketReadService],
  exports: [HttpPingBucketReadService],
})
export class HttpPingBucketReadModule {}
