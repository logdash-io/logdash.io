import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiProduces, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/core/decorators/is-public';
import { BadgeCompositionService } from '../composition/badge-composition.service';
import { ReadBadgeQuery } from './dto/read-badge.query';

@ApiTags('Badges')
@Controller()
export class BadgeCoreController {
  constructor(private readonly badgeCompositionService: BadgeCompositionService) {}

  @Public()
  @Get('/public_dashboards/:publicDashboardId/badges/:badgeKey.svg')
  @ApiProduces('image/svg+xml')
  @Header('Content-Type', 'image/svg+xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=60')
  @Header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")
  public async readBadge(
    @Param('publicDashboardId') publicDashboardId: string,
    @Param('badgeKey') badgeKey: string,
    @Query() query: ReadBadgeQuery,
  ): Promise<string> {
    return this.badgeCompositionService.composeBadge({
      publicDashboardIdOrDomain: publicDashboardId,
      badgeKey,
      style: query.style,
      period: query.period,
      theme: query.theme,
    });
  }
}
