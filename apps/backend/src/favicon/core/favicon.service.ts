import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { safeHttpRequest } from '../../shared/ssrf/safe-http-request';
import { findFaviconUrls, sniffImageType } from './favicon-candidates';

export interface Favicon {
  contentType: string;
  body: Buffer;
}

const FOUND_TTL_SECONDS = 7 * 24 * 60 * 60;
const MISSING_TTL_SECONDS = 6 * 60 * 60;
const REQUEST_TIMEOUT_MS = 5_000;
const MAX_ICON_BYTES = 256 * 1024;
const USER_AGENT = 'Mozilla/5.0 (compatible; LogdashFavicon/1.0; +https://logdash.io)';

@Injectable()
export class FaviconService {
  public constructor(private readonly redisService: RedisService) {}

  public async readFavicon(hostname: string): Promise<Favicon | null> {
    const key = `favicon:${hostname}`;
    const cached = await this.redisService.get(key);

    if (cached !== null) {
      if (!cached) return null;

      const { contentType, body } = JSON.parse(cached) as { contentType: string; body: string };
      return { contentType, body: Buffer.from(body, 'base64') };
    }

    const favicon =
      (await this.resolveFromSite(hostname)) ?? (await this.resolveFromGoogle(hostname));

    await this.redisService.set(
      key,
      favicon
        ? JSON.stringify({
            contentType: favicon.contentType,
            body: favicon.body.toString('base64'),
          })
        : '',
      favicon ? FOUND_TTL_SECONDS : MISSING_TTL_SECONDS,
    );

    return favicon;
  }

  private async resolveFromSite(hostname: string): Promise<Favicon | null> {
    for (const url of await this.findIconUrls(hostname)) {
      const favicon = await this.download(url);
      if (favicon) return favicon;
    }

    return null;
  }

  private async findIconUrls(hostname: string): Promise<string[]> {
    const homepage = `https://${hostname}/`;

    try {
      const page = await safeHttpRequest({
        url: homepage,
        responseType: 'text',
        timeout: REQUEST_TIMEOUT_MS,
        headers: { Accept: 'text/html', 'User-Agent': USER_AGENT },
      });

      return findFaviconUrls(String(page.data), page.config.url ?? homepage);
    } catch {
      return [`${homepage}favicon.ico`];
    }
  }

  private async resolveFromGoogle(hostname: string): Promise<Favicon | null> {
    return this.download(`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`);
  }

  private async download(url: string): Promise<Favicon | null> {
    try {
      const body = url.startsWith('data:')
        ? Buffer.from(await (await fetch(url)).arrayBuffer())
        : Buffer.from(
            (
              await safeHttpRequest({
                url,
                responseType: 'arraybuffer',
                timeout: REQUEST_TIMEOUT_MS,
                headers: { 'User-Agent': USER_AGENT },
              })
            ).data as ArrayBuffer,
          );
      const contentType = sniffImageType(body);

      return contentType && body.length <= MAX_ICON_BYTES ? { contentType, body } : null;
    } catch {
      return null;
    }
  }
}
