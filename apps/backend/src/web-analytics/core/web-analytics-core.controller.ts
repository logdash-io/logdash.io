import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Put,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/core/decorators/is-public';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { getClusterPlanConfig } from '../../shared/configs/cluster-plan-configs';
import { WebAnalyticsReadService } from '../read/web-analytics-read.service';
import { WebAnalyticsWriteService } from '../write/web-analytics-write.service';
import { WebAnalyticsIngestionService } from '../ingestion/web-analytics-ingestion.service';
import { ConfigureWebAnalyticsBody } from './dto/configure-web-analytics.body';
import { CollectWebEventsBody } from './dto/collect-web-events.body';
import {
  ReadWebAnalyticsBreakdownQuery,
  ReadWebAnalyticsFunnelQuery,
  ReadWebAnalyticsQuery,
  ReadWebAnalyticsVisitorQuery,
  ReadWebAnalyticsVisitorsQuery,
} from './dto/read-web-analytics.query';
import {
  WebAnalyticsBreakdownResponse,
  WebAnalyticsFunnelResponse,
  WebAnalyticsJourneysResponse,
  WebAnalyticsOverviewResponse,
  WebAnalyticsResponse,
  WebAnalyticsRetentionResponse,
  WebAnalyticsStatusResponse,
  WebAnalyticsVisitorResponse,
  WebAnalyticsVisitorsResponse,
} from './dto/web-analytics.response';
import {
  WebAnalyticsSiteResponse,
  WebAnalyticsSiteSerialized,
} from './entities/web-analytics-site.interface';
import { WebAnalyticsSiteSerializer } from './entities/web-analytics-site.serializer';

@ApiTags('Web analytics')
@Controller()
export class WebAnalyticsCoreController {
  constructor(
    private readonly read: WebAnalyticsReadService,
    private readonly write: WebAnalyticsWriteService,
    private readonly ingestion: WebAnalyticsIngestionService,
    private readonly clusters: ClusterReadCachedService,
  ) {}

  @Get('clusters/:clusterId/web_analytics/site')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsSiteResponse })
  public async readSite(@Param('clusterId') clusterId: string): Promise<WebAnalyticsSiteResponse> {
    const site = await this.read.readSiteByClusterId(clusterId);
    return { site: site ? WebAnalyticsSiteSerializer.serialize(site) : null };
  }

  @Put('clusters/:clusterId/web_analytics/site')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsSiteSerialized })
  public async configure(
    @Param('clusterId') clusterId: string,
    @Body() body: ConfigureWebAnalyticsBody,
    @CurrentUserId() userId: string,
  ): Promise<WebAnalyticsSiteSerialized> {
    return WebAnalyticsSiteSerializer.serialize(
      await this.write.configure(clusterId, body.origins, userId),
    );
  }

  @Get('clusters/:clusterId/web_analytics/status')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsStatusResponse })
  public async status(@Param('clusterId') clusterId: string): Promise<WebAnalyticsStatusResponse> {
    return this.read.readStatus(clusterId);
  }

  @Get('clusters/:clusterId/web_analytics')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsResponse })
  public async report(
    @Param('clusterId') clusterId: string,
    @Query() query: ReadWebAnalyticsQuery,
  ): Promise<WebAnalyticsResponse> {
    return this.read.readReport(clusterId, query, await this.retentionDays(clusterId));
  }

  @Get('clusters/:clusterId/web_analytics/overview')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsOverviewResponse })
  public async overview(
    @Param('clusterId') clusterId: string,
    @Query() query: ReadWebAnalyticsQuery,
  ): Promise<WebAnalyticsOverviewResponse> {
    return this.read.readOverview(clusterId, query, await this.retentionDays(clusterId));
  }

  @Get('clusters/:clusterId/web_analytics/breakdown')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsBreakdownResponse })
  public async breakdown(
    @Param('clusterId') clusterId: string,
    @Query() query: ReadWebAnalyticsBreakdownQuery,
  ): Promise<WebAnalyticsBreakdownResponse> {
    return {
      rows: await this.read.readBreakdown(
        clusterId,
        query,
        query.dimension,
        await this.retentionDays(clusterId),
      ),
    };
  }

  @Get('clusters/:clusterId/web_analytics/visitors')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsVisitorsResponse })
  public async visitors(
    @Param('clusterId') clusterId: string,
    @Query() query: ReadWebAnalyticsVisitorsQuery,
  ): Promise<WebAnalyticsVisitorsResponse> {
    return this.read.readVisitors(
      clusterId,
      query,
      await this.retentionDays(clusterId),
      query.offset,
    );
  }

  @Get('clusters/:clusterId/web_analytics/visitors/:visitorId')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsVisitorResponse })
  public async visitor(
    @Param('clusterId') clusterId: string,
    @Param('visitorId') visitorId: string,
    @Query() query: ReadWebAnalyticsVisitorQuery,
  ): Promise<WebAnalyticsVisitorResponse> {
    if (!/^[a-f0-9]{64}$/.test(visitorId)) throw new BadRequestException('Invalid visitor id');
    return this.read.readVisitor(clusterId, visitorId, query.tz);
  }

  @Get('clusters/:clusterId/web_analytics/journeys')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsJourneysResponse })
  public async journeys(
    @Param('clusterId') clusterId: string,
    @Query() query: ReadWebAnalyticsQuery,
  ): Promise<WebAnalyticsJourneysResponse> {
    return this.read.readJourneys(clusterId, query, await this.retentionDays(clusterId));
  }

  @Get('clusters/:clusterId/web_analytics/funnel')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsFunnelResponse })
  public async funnel(
    @Param('clusterId') clusterId: string,
    @Query() query: ReadWebAnalyticsFunnelQuery,
  ): Promise<WebAnalyticsFunnelResponse> {
    return this.read.readFunnel(clusterId, query, await this.retentionDays(clusterId));
  }

  @Get('clusters/:clusterId/web_analytics/retention')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsRetentionResponse })
  public async retention(
    @Param('clusterId') clusterId: string,
    @Query() query: ReadWebAnalyticsQuery,
  ): Promise<WebAnalyticsRetentionResponse> {
    return this.read.readRetention(clusterId, query, await this.retentionDays(clusterId));
  }

  @Public()
  @Post('web_events')
  @HttpCode(202)
  @ApiResponse({ status: 202, description: 'Events accepted for processing' })
  public async collect(
    @Body() body: CollectWebEventsBody,
    @Headers('origin') origin: string | undefined,
    @Headers('user-agent') userAgent: string = '',
  ): Promise<void> {
    await this.ingestion.collect(body, origin, userAgent);
  }

  private async retentionDays(clusterId: string): Promise<number> {
    return getClusterPlanConfig(await this.clusters.readTier(clusterId)).webAnalytics.retentionDays;
  }
}
