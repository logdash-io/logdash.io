import { Module } from '@nestjs/common';
import { HttpPingAggregationModule } from 'src/http-ping/aggregation/http-ping-aggregation.module';
import { HttpPingBucketWriteModule } from '../write/http-ping-bucket-write.module';
import { HttpPingBucketSchedulerService } from './http-ping-bucket-scheduler.service';

@Module({
  imports: [HttpPingBucketWriteModule, HttpPingAggregationModule],
  providers: [HttpPingBucketSchedulerService],
})
export class HttpPingBucketSchedulerModule {}
