import { INestApplication } from '@nestjs/common';
import nock from 'nock';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { App } from 'supertest/types';
import {
  DATACENTER_ASNS_URL,
  DBIP_URL,
  WebAnalyticsGeoService,
} from '../../src/web-analytics/ingestion/web-analytics-geo.service';
import { LoggerMock } from './logger-mock';

export class WebAnalyticsGeoUtils {
  private readonly geo: WebAnalyticsGeoService;

  constructor(app: INestApplication<App>) {
    this.geo = app.get(WebAnalyticsGeoService);
  }

  public reset(): void {
    Object.assign(this.geo, new WebAnalyticsGeoService(new LoggerMock()));
  }

  public async refresh(month: string, status = 200): Promise<void> {
    const fixture = (name: string): Buffer =>
      gzipSync(readFileSync(join(__dirname, 'geoip', name)));
    for (const [url, body] of [
      [`${DBIP_URL}/dbip-country-lite-${month}.mmdb.gz`, fixture('GeoIP2-Country-Test.mmdb')],
      [`${DBIP_URL}/dbip-asn-lite-${month}.mmdb.gz`, fixture('GeoLite2-ASN-Test.mmdb')],
      [DATACENTER_ASNS_URL, 'AS35908 # Krypt, hosting\n'],
    ] as const) {
      const { origin, pathname } = new URL(url);
      nock(origin).get(pathname).reply(status, body);
    }
    await this.geo.refresh();
  }
}
