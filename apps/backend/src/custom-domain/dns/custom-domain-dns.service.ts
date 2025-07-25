import { Injectable } from '@nestjs/common';
<<<<<<< Updated upstream
import { resolveCname } from 'dns/promises';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class CustomDomainDnsService {
  constructor(private readonly logger: Logger) {}

  public async checkCnameRecord(domain: string): Promise<string | null> {
    try {
      const results = await resolveCname(domain);
      this.logger.info('CNAME records', {
        domain,
        results,
      });
=======
import { promisify } from 'util';
import dns from 'dns/promises';

@Injectable()
export class CustomDomainDnsService {
  public async checkCnameRecord(domain: string): Promise<string | null> {
    try {
      const results = await dns.resolveCname(domain);
>>>>>>> Stashed changes
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
