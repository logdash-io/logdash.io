import { Module } from '@nestjs/common';
import { HttpPingBucketAggregateModule } from '../aggregate/http-ping-bucket-aggregate.module';
import { HttpPingBucketWriteModule } from '../write/http-ping-bucket-write.module';
import { HttpPingBucketSchedulerService } from './http-ping-bucket-scheduler.service';

@Module({
  imports: [HttpPingBucketWriteModule, HttpPingBucketAggregateModule],
  providers: [HttpPingBucketSchedulerService],
})
export class HttpPingBucketSchedulerModule {}
