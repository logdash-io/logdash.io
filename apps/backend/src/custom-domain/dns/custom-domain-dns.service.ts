import { Injectable } from '@nestjs/common';
import { promisify } from 'util';
import dns from 'dns/promises';

@Injectable()
export class CustomDomainDnsService {
  public async checkCnameRecord(domain: string): Promise<string | null> {
    try {
      const results = await dns.resolveCname(domain);
      if (results && results.length > 0) {
        return results[0];
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
