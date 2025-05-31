import { Module } from '@nestjs/common';
import { ClickhouseO11yController } from './clickhouse-o11y.controller';
import { ClickhouseO11yService } from './clickhouse-o11y.service';

@Module({
  controllers: [ClickhouseO11yController],
  providers: [ClickhouseO11yService],
})
export class ClickhouseO11yModule {}
