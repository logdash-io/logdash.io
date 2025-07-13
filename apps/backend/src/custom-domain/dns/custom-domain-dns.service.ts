import { Injectable } from '@nestjs/common';
import dns from 'dns/promises';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class CustomDomainDnsService {
  constructor(private readonly logger: Logger) {}

  public async checkCnameRecord(domain: string): Promise<string | null> {
    try {
      const results = await dns.resolveCname(domain);
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
