import { Controller, Get, NotFoundException, Param, Res, StreamableFile } from '@nestjs/common';
import { ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../auth/core/decorators/is-public';
import { ThrottleFavicon } from '../../shared/throttling/rate-limit.decorator';
import { HOSTNAME_PATTERN } from './favicon-candidates';
import { FaviconService } from './favicon.service';

@ApiTags('Favicons')
@Controller()
export class FaviconCoreController {
  public constructor(private readonly faviconService: FaviconService) {}

  @Public()
  @ThrottleFavicon()
  @Get('/favicons/:hostname')
  @ApiProduces('image/*')
  public async readFavicon(
    @Param('hostname') rawHostname: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const hostname = rawHostname.toLowerCase().replace(/\.$/, '');
    const favicon = HOSTNAME_PATTERN.test(hostname)
      ? await this.faviconService.readFavicon(hostname)
      : null;

    if (!favicon) {
      throw new NotFoundException('Favicon not found');
    }

    response.set({
      'Cache-Control': 'public, max-age=86400',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    });

    return new StreamableFile(favicon.body, { type: favicon.contentType });
  }
}
