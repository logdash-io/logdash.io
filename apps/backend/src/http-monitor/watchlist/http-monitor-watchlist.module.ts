import { Module } from '@nestjs/common';
import { HttpPingBucketReadModule } from '../../http-ping-bucket/read/http-ping-bucket-read.module';
import { HttpPingBucketWriteModule } from '../../http-ping-bucket/write/http-ping-bucket-write.module';
import { HttpMonitorReadModule } from '../read/http-monitor-read.module';
import { HttpMonitorWatchlistService } from './http-monitor-watchlist.service';

@Module({
  imports: [HttpMonitorReadModule, HttpPingBucketReadModule, HttpPingBucketWriteModule],
  providers: [HttpMonitorWatchlistService],
  exports: [HttpMonitorWatchlistService],
})
export class HttpMonitorWatchlistModule {}
