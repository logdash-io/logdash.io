import { Controller, Get, Param, Res } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../auth/core/decorators/is-public';
import { StatusPageCompositionService } from '../composition/status-page-composition.service';
import { StatusPageDto } from './dto/status-page.dto';

@ApiTags('Status Pages')
@Controller()
export class StatusPageCoreController {
  constructor(private readonly statusPageCompositionService: StatusPageCompositionService) {}

  @Public()
  @Get('/v1/status_pages/:statusPageId')
  @ApiOperation({ operationId: 'readStatusPage', summary: 'Read a public status page' })
  @ApiParam({ name: 'statusPageId', description: 'Status page id or its verified custom domain' })
  @ApiOkResponse({ type: StatusPageDto })
  @ApiForbiddenResponse({ description: 'The status page is not public' })
  @ApiNotFoundResponse({ description: 'No status page with this id or domain' })
  public async readStatusPage(
    @Param('statusPageId') statusPageId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StatusPageDto> {
    const statusPage = await this.statusPageCompositionService.composeStatusPage(statusPageId);

    response.setHeader('Cache-Control', 'public, max-age=60');

    return statusPage;
  }
}
