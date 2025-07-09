import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CustomDomainReadService } from '../read/custom-domain-read.service';
import { CustomDomainWriteService } from '../write/custom-domain-write.service';
import { CustomDomainDnsService } from '../dns/custom-domain-dns.service';
import { CustomDomainStatus } from '../core/enums/custom-domain-status.enum';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';
import { AuditLogCustomDomainAction } from '../../audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';
import { getEnvConfig } from '../../shared/configs/env-configs';

const MAX_ATTEMPTS = 10;

@Injectable()
export class CustomDomainRegistrationService {
  constructor(
    private readonly customDomainReadService: CustomDomainReadService,
    private readonly customDomainWriteService: CustomDomainWriteService,
    private readonly customDomainDnsService: CustomDomainDnsService,
    private readonly auditLog: AuditLog,
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
    await this.auditLog.create({
      action: AuditLogCustomDomainAction.AttemptIncrease,
      relatedDomain: RelatedDomain.CustomDomain,
      relatedEntityId: domainId,
    });

    await this.customDomainWriteService.incrementAttemptCount(domainId);
    const newAttemptCount = currentAttemptCount + 1;

    if (newAttemptCount >= MAX_ATTEMPTS) {
      await this.auditLog.create({
        action: AuditLogCustomDomainAction.VerificationFailed,
        relatedDomain: RelatedDomain.CustomDomain,
        relatedEntityId: domainId,
      });

      await this.customDomainWriteService.update({
        id: domainId,
        status: CustomDomainStatus.Failed,
      });
      return;
    }

    const cnameRecord = await this.customDomainDnsService.checkCnameRecord(domain);

    if (cnameRecord === getEnvConfig().customDomain.targetCname) {
      await this.customDomainWriteService.update({
        id: domainId,
        status: CustomDomainStatus.Verified,
      });

      await this.auditLog.create({
        action: AuditLogCustomDomainAction.VerificationSucceeded,
        relatedDomain: RelatedDomain.CustomDomain,
        relatedEntityId: domainId,
      });
    }
  }
}
