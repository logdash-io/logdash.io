import { Module } from '@nestjs/common';
import { CustomDomainRegistrationService } from './custom-domain-registration.service';
import { CustomDomainReadModule } from '../read/custom-domain-read.module';
import { CustomDomainWriteModule } from '../write/custom-domain-write.module';
import { CustomDomainDnsModule } from '../dns/custom-domain-dns.module';

@Module({
  imports: [CustomDomainReadModule, CustomDomainWriteModule, CustomDomainDnsModule],
  providers: [CustomDomainRegistrationService],
  exports: [CustomDomainRegistrationService],
})
export class CustomDomainRegistrationModule {}
