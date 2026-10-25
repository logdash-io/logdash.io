import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AsnResponse, CountryResponse, Reader } from 'mmdb-lib';
import { isIP } from 'node:net';
import { promisify } from 'node:util';
import { gunzip } from 'node:zlib';
import { WEB_ANALYTICS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { errorMessage } from '../../shared/utils/error-message';

export const DBIP_URL = 'https://download.db-ip.com/free';
export const DATACENTER_ASNS_URL =
  'https://raw.githubusercontent.com/X4BNet/lists_vpn/main/input/datacenter/ASN.txt';
// ponytail: Cloudflare, Akamai's AS36183 and Fastly also carry iCloud Private Relay and WARP users,
// so bots on Workers or Fastly Compute get through; match their published egress ranges if that matters.
const PRIVACY_RELAY_ASNS = new Set([13335, 36183, 54113]);
const EXTRA_DATACENTER_ASNS = [139070];

const unzip = promisify(gunzip);

type Databases = {
  month: string;
  country: Reader<CountryResponse>;
  asn: Reader<AsnResponse>;
};

@Injectable()
export class WebAnalyticsGeoService implements OnApplicationBootstrap {
  private databases: Databases | null = null;
  private datacenterAsns = new Set<number>();

  constructor(@Inject(WEB_ANALYTICS_LOGGER) private readonly logger: LogdashLogger) {}

  public onApplicationBootstrap(): void {
    if (process.env.NODE_ENV !== 'test') void this.refresh();
  }

  @Cron(CronExpression.EVERY_HOUR)
  public async runCron(): Promise<void> {
    await this.refresh();
  }

  public lookup(ip: string): { country: string; datacenter: boolean } {
    if (!this.databases || !isIP(ip)) return { country: '', datacenter: false };
    const asn = this.databases.asn.get(ip)?.autonomous_system_number;
    return {
      country: this.databases.country.get(ip)?.country?.iso_code ?? '',
      datacenter: asn !== undefined && this.datacenterAsns.has(asn),
    };
  }

  public async refresh(now = new Date()): Promise<void> {
    await Promise.all([this.refreshDatabases(now), this.refreshDatacenterAsns()]);
  }

  private async refreshDatabases(now: Date): Promise<void> {
    let failure: unknown;
    for (const offset of [0, -1]) {
      const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset))
        .toISOString()
        .slice(0, 7);
      if (month === this.databases?.month) return;
      try {
        const [country, asn] = await Promise.all([
          this.download(`${DBIP_URL}/dbip-country-lite-${month}.mmdb.gz`),
          this.download(`${DBIP_URL}/dbip-asn-lite-${month}.mmdb.gz`),
        ]);
        this.databases = {
          month,
          country: new Reader<CountryResponse>(await unzip(country)),
          asn: new Reader<AsnResponse>(await unzip(asn)),
        };
        return;
      } catch (error) {
        failure = error;
      }
    }
    this.logger.error('Failed to download the DB-IP databases', { error: errorMessage(failure) });
  }

  private async refreshDatacenterAsns(): Promise<void> {
    try {
      const text = (await this.download(DATACENTER_ASNS_URL)).toString('utf8');
      const listed = [...text.matchAll(/^AS(\d+)\b/gm)].map((match) => Number(match[1]));
      if (!listed.length) throw new Error('The datacenter ASN list is empty');
      this.datacenterAsns = new Set(
        [...listed, ...EXTRA_DATACENTER_ASNS].filter((asn) => !PRIVACY_RELAY_ASNS.has(asn)),
      );
    } catch (error) {
      this.logger.error('Failed to download the datacenter ASN list', {
        error: errorMessage(error),
      });
    }
  }

  private async download(url: string): Promise<Buffer> {
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
}
