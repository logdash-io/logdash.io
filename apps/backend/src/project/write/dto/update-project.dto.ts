export class UpdateProjectDto {
  id: string;
  name?: string;
  creatorId?: string;
  lastDeletionIndex?: number;
  clusterId?: string;
  clearMembers?: boolean;
}
