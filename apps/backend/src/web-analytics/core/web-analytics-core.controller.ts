import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Param,
  Put,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { isIP } from 'node:net';
import { Public } from '../../auth/core/decorators/is-public';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { getClusterPlanConfig } from '../../shared/configs/cluster-plan-configs';
import { WebAnalyticsReadService } from '../read/web-analytics-read.service';
import { WebAnalyticsDayReadService } from '../read/web-analytics-day-read.service';
import { WebAnalyticsWriteService } from '../write/web-analytics-write.service';
import { WebAnalyticsIngestionService } from '../ingestion/web-analytics-ingestion.service';
import { IngestProjectService } from '../../project/ingest/ingest-project.service';
import { ConfigureWebAnalyticsBody } from './dto/configure-web-analytics.body';
import { UpdateWebAnalyticsGoalsBody } from './dto/update-web-analytics-goals.body';
import { TrackEventBody } from './dto/track-event.body';
import { CollectWebEventsBody, EVENT_NAME, PROP_KEY } from './dto/collect-web-events.body';
import {
  isLocalDate,
  ReadWebAnalyticsBreakdownQuery,
  ReadWebAnalyticsDayQuery,
  ReadWebAnalyticsDaysQuery,
  ReadWebAnalyticsDayVisitsQuery,
  ReadWebAnalyticsFunnelQuery,
  ReadWebAnalyticsQuery,
  ReadWebAnalyticsTimeZoneQuery,
  ReadWebAnalyticsVisitorsQuery,
} from './dto/read-web-analytics.query';
import {
  WebAnalyticsBreakdownResponse,
  WebAnalyticsDayResponse,
  WebAnalyticsDaysResponse,
  WebAnalyticsDayVisitsResponse,
  WebAnalyticsEventResponse,
  WebAnalyticsGoalsResponse,
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
    private readonly days: WebAnalyticsDayReadService,
    private readonly write: WebAnalyticsWriteService,
    private readonly ingestion: WebAnalyticsIngestionService,
    private readonly clusters: ClusterReadCachedService,
    private readonly ingestProjects: IngestProjectService,
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

  @Get('clusters/:clusterId/web_analytics/days')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsDaysResponse })
  public async readDays(
    @Param('clusterId') clusterId: string,
    @Query() query: ReadWebAnalyticsDaysQuery,
  ): Promise<WebAnalyticsDaysResponse> {
    return this.days.readDays(clusterId, query, await this.retentionDays(clusterId));
  }

  @Get('clusters/:clusterId/web_analytics/days/:date')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsDayResponse })
  public async readDay(
    @Param('clusterId') clusterId: string,
    @Param('date') date: string,
    @Query() query: ReadWebAnalyticsDayQuery,
  ): Promise<WebAnalyticsDayResponse> {
    if (!isLocalDate(date)) throw new BadRequestException('date must be a day as YYYY-MM-DD');
    return this.days.readDay(clusterId, date, query, await this.retentionDays(clusterId));
  }

  @Get('clusters/:clusterId/web_analytics/days/:date/visits')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsDayVisitsResponse })
  public async readDayVisits(
    @Param('clusterId') clusterId: string,
    @Param('date') date: string,
    @Query() query: ReadWebAnalyticsDayVisitsQuery,
  ): Promise<WebAnalyticsDayVisitsResponse> {
    if (!isLocalDate(date)) throw new BadRequestException('date must be a day as YYYY-MM-DD');
    return this.days.readDayVisits(clusterId, date, query, await this.retentionDays(clusterId));
  }

  @Get('clusters/:clusterId/web_analytics/goals')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsGoalsResponse })
  public async readGoals(
    @Param('clusterId') clusterId: string,
    @Query() query: ReadWebAnalyticsTimeZoneQuery,
  ): Promise<WebAnalyticsGoalsResponse> {
    const site = await this.read.readSiteByClusterId(clusterId);
    return this.days.readGoals(clusterId, query.tz, site?.goals ?? []);
  }

  @Put('clusters/:clusterId/web_analytics/goals')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsSiteSerialized })
  public async updateGoals(
    @Param('clusterId') clusterId: string,
    @Body() body: UpdateWebAnalyticsGoalsBody,
    @CurrentUserId() userId: string,
  ): Promise<WebAnalyticsSiteSerialized> {
    return WebAnalyticsSiteSerializer.serialize(
      await this.write.updateGoals(clusterId, body.goals, userId),
    );
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

  @Get('clusters/:clusterId/web_analytics/events/:name')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsEventResponse })
  public async event(
    @Param('clusterId') clusterId: string,
    @Param('name') name: string,
    @Query() query: ReadWebAnalyticsQuery,
  ): Promise<WebAnalyticsEventResponse> {
    if (!EVENT_NAME.test(name)) throw new BadRequestException('Invalid event name');
    return this.read.readEvent(clusterId, name, query, await this.retentionDays(clusterId));
  }

  @Get('clusters/:clusterId/web_analytics/events/:name/properties/:key')
  @ApiBearerAuth()
  @UseGuards(ClusterMemberGuard)
  @ApiResponse({ type: WebAnalyticsBreakdownResponse })
  public async eventProperty(
    @Param('clusterId') clusterId: string,
    @Param('name') name: string,
    @Param('key') key: string,
    @Query() query: ReadWebAnalyticsQuery,
  ): Promise<WebAnalyticsBreakdownResponse> {
    if (!EVENT_NAME.test(name)) throw new BadRequestException('Invalid event name');
    if (!PROP_KEY.test(key)) throw new BadRequestException('Invalid property key');
    return {
      rows: await this.read.readEventProperty(
        clusterId,
        name,
        key,
        query,
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
    @Query() query: ReadWebAnalyticsTimeZoneQuery,
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
    @Headers('x-logdash-client-ip') clientIp: string = '',
    @Ip() requestIp: string,
  ): Promise<void> {
    await this.ingestion.collect(body, origin, userAgent, isIP(clientIp) ? clientIp : requestIp);
  }

  @Public()
  @Post('events')
  @HttpCode(202)
  @ApiSecurity('project-api-key')
  @ApiResponse({ status: 202, description: 'Event accepted for processing' })
  public async track(
    @Body() body: TrackEventBody,
    @Headers('project-api-key') apiKeyValue: string | undefined,
    @Headers('user-agent') userAgent: string = '',
    @Ip() ip: string,
  ): Promise<void> {
    const { clusterId, app } = await this.ingestProjects.resolveAppName(apiKeyValue, body.app);
    await this.ingestion.track(body, clusterId, app, userAgent, ip);
  }

  private async retentionDays(clusterId: string): Promise<number> {
    return getClusterPlanConfig(await this.clusters.readTier(clusterId)).webAnalytics.retentionDays;
  }
}
