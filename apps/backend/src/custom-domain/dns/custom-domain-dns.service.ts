import { Injectable } from '@nestjs/common';
import { promisify } from 'util';
import * as dns from 'dns';

@Injectable()
export class CustomDomainDnsService {
  private readonly resolveCname = promisify(dns.resolveCname);

  public async checkCnameRecord(domain: string): Promise<string | null> {
    try {
      const results = await this.resolveCname(domain);
      console.log('results', results);
      if (results && results.length > 0) {
        return results[0];
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
