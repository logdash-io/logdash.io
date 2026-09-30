import { Inject, Injectable } from '@nestjs/common';
import { HttpPingBucketReadService } from '../../http-ping-bucket/read/http-ping-bucket-read.service';
import { HttpPingBucketWriteService } from '../../http-ping-bucket/write/http-ping-bucket-write.service';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { HTTP_MONITORS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { errorMessage } from '../../shared/utils/error-message';
import { HttpMonitorNormalized } from '../core/entities/http-monitor.interface';
import { HttpMonitorReadService } from '../read/http-monitor-read.service';
import { normalizeMonitorUrl } from './normalize-monitor-url';

@Injectable()
export class HttpMonitorWatchlistService {
  constructor(
    private readonly httpMonitorReadService: HttpMonitorReadService,
    private readonly httpPingBucketReadService: HttpPingBucketReadService,
    private readonly httpPingBucketWriteService: HttpPingBucketWriteService,
    @Inject(HTTP_MONITORS_LOGGER) private readonly logger: LogdashLogger,
  ) {}

  /** Best effort: the monitor already exists, so a failed copy must not fail its creation. */
  public async inheritHistory(monitor: HttpMonitorNormalized): Promise<void> {
    try {
      await this.copyWatchlistBuckets(monitor);
    } catch (error) {
      this.logger.error('Failed to inherit watchlist history', {
        httpMonitorId: monitor.id,
        error: errorMessage(error),
      });
    }
  }

  private async copyWatchlistBuckets(monitor: HttpMonitorNormalized): Promise<void> {
    const watchlistProjectId = getEnvConfig().watchlist.projectId;

    if (!watchlistProjectId || !monitor.url || monitor.projectId === watchlistProjectId) {
      return;
    }

    const url = normalizeMonitorUrl(monitor.url);
    // ponytail: loads and normalizes every watchlist monitor per create, fine up to a few hundred; store a normalized url with an index if the watchlist grows past that
    const [source] = (await this.httpMonitorReadService.readByProjectId(watchlistProjectId))
      .filter((watched) => watched.url && normalizeMonitorUrl(watched.url) === url)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (!source) {
      return;
    }

    const buckets = await this.httpPingBucketReadService.readByMonitorId(source.id);

    await this.httpPingBucketWriteService.createMany(
      buckets.map((bucket) => ({ ...bucket, httpMonitorId: monitor.id })),
    );
  }
}
