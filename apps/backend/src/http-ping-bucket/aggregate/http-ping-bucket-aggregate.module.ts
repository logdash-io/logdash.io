import { Module } from '@nestjs/common';
import { HttpPingBucketReadModule } from '../read/http-ping-bucket-read.module';
import { HttpPingBucketAggregateService } from './http-ping-bucket-aggregate.service';

@Module({
  imports: [HttpPingBucketReadModule],
  providers: [HttpPingBucketAggregateService],
  exports: [HttpPingBucketAggregateService],
})
export class HttpPingBucketAggregateModule {}
