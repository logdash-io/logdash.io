import { Module } from '@nestjs/common';
import { CustomDomainDnsService } from './custom-domain-dns.service';

@Module({
  providers: [CustomDomainDnsService],
  exports: [CustomDomainDnsService],
})
export class CustomDomainDnsModule {}
