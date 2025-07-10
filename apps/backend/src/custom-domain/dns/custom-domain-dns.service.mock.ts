import { Injectable } from '@nestjs/common';

interface DomainMockConfig {
  domain: string;
  failCount: number;
  targetCname: string;
}

@Injectable()
export class CustomDomainDnsServiceMock {
  private mockConfigs: Map<string, DomainMockConfig> = new Map();
  private callCounts: Map<string, number> = new Map();

  public configureDomain(config: DomainMockConfig): void {
    this.mockConfigs.set(config.domain, config);
    this.callCounts.set(config.domain, 0);
  }

  public async checkCnameRecord(domain: string): Promise<string | null> {
    const config = this.mockConfigs.get(domain);
    if (!config) {
      return null;
    }

    const currentCallCount = this.callCounts.get(domain) || 0;
    this.callCounts.set(domain, currentCallCount + 1);

    if (currentCallCount < config.failCount) {
      return null;
    }

    return config.targetCname;
  }

  public getCallCount(domain: string): number {
    return this.callCounts.get(domain) || 0;
  }

  public reset(): void {
    this.mockConfigs.clear();
    this.callCounts.clear();
  }
}
