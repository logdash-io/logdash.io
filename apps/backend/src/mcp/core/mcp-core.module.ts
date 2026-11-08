import { Module } from '@nestjs/common';
import { ClusterReadModule } from '../../cluster/read/cluster-read.module';
import { WebAnalyticsReadModule } from '../../web-analytics/read/web-analytics-read.module';
import { WebAnalyticsWriteModule } from '../../web-analytics/write/web-analytics-write.module';
import { McpCoreController } from './mcp-core.controller';
import { McpToolsService } from './mcp-tools.service';

@Module({
  imports: [ClusterReadModule, WebAnalyticsReadModule, WebAnalyticsWriteModule],
  controllers: [McpCoreController],
  providers: [McpToolsService],
})
export class McpCoreModule {}
