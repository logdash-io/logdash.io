import { Module } from '@nestjs/common';
import { ClickhouseO11yService } from './clickhouse-o11y.service';

@Module({
  providers: [ClickhouseO11yService],
})
export class ClickhouseO11yModule {}
