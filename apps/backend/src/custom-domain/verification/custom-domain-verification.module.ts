import { Module } from '@nestjs/common';
import { CustomDomainVerificationService } from './custom-domain-verification.service';
import { CustomDomainReadModule } from '../read/custom-domain-read.module';

@Module({
  imports: [CustomDomainReadModule],
  providers: [CustomDomainVerificationService],
  exports: [CustomDomainVerificationService],
})
export class CustomDomainVerificationModule {}
