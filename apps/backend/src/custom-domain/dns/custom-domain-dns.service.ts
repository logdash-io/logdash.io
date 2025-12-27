import { Inject, Injectable } from '@nestjs/common';
import { resolveCname } from 'dns/promises';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { CUSTOM_DNS_LOGGER } from '../../shared/logdash/logdash-tokens';

@Injectable()
export class CustomDomainDnsService {
  constructor(@Inject(CUSTOM_DNS_LOGGER) private readonly logger: LogdashLogger) {}

  public async checkCnameRecord(domain: string): Promise<string | null> {
    try {
      const results = await resolveCname(domain);
      this.logger.info('CNAME records', {
        domain,
        results,
      });
      if (results && results.length > 0) {
        return results[0];
      }
      return null;
    } catch (error) {
      this.logger.error('Error resolving CNAME record', {
        domain,
        error: error.message,
      });
      return null;
    }
  }
}
