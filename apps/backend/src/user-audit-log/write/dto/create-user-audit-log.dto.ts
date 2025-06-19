export class CreateUserAuditLogDto {
  userId: string;
  actor: string;
  relatedDomain: string;
  description: string;
}
