export class CreateAuditLogDto {
  userId?: string;
  actor?: string;
  action?: string;
  relatedDomain?: string;
  description?: string;
  relatedEntityId?: string;
}
