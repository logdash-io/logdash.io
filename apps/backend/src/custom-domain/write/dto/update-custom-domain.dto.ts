import { CustomDomainStatus } from '../../core/enums/custom-domain-status.enum';

export class UpdateCustomDomainDto {
  id: string;
  domain?: string;
  attemptCount?: number;
  status?: CustomDomainStatus;
}
