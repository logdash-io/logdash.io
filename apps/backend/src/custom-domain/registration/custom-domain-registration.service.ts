import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CustomDomainReadService } from '../read/custom-domain-read.service';
import { CustomDomainWriteService } from '../write/custom-domain-write.service';
import { CustomDomainDnsService } from '../dns/custom-domain-dns.service';
import { CustomDomainStatus } from '../core/enums/custom-domain-status.enum';

const TARGET_CNAME = 'status.logdash.io';
const MAX_ATTEMPTS = 10;

@Injectable()
export class CustomDomainRegistrationService {
  constructor(
    private readonly customDomainReadService: CustomDomainReadService,
    private readonly customDomainWriteService: CustomDomainWriteService,
    private readonly customDomainDnsService: CustomDomainDnsService,
  ) {}

  @Cron('*/30 * * * * *')
  public async verifyDomains(): Promise<void> {
    const domainsToVerify = await this.customDomainReadService.readDomainsToVerify();

    for (const domain of domainsToVerify) {
      try {
        await this.verifyDomain(domain.id, domain.domain, domain.attemptCount);
      } catch (error) {}
    }
  }

  private async verifyDomain(
    domainId: string,
    domain: string,
    currentAttemptCount: number,
  ): Promise<void> {
    await this.customDomainWriteService.incrementAttemptCount(domainId);
    const newAttemptCount = currentAttemptCount + 1;

    if (newAttemptCount >= MAX_ATTEMPTS) {
      await this.customDomainWriteService.update({
        id: domainId,
        status: CustomDomainStatus.Failed,
      });
      return;
    }

    const cnameRecord = await this.customDomainDnsService.checkCnameRecord(domain);

    if (cnameRecord === TARGET_CNAME) {
      await this.customDomainWriteService.update({
        id: domainId,
        status: CustomDomainStatus.Verified,
      });
    }
  }
}
