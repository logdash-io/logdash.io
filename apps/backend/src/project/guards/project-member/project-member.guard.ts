import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ProjectReadCachedService } from '../../read/project-read-cached.service';

const PROJECT_ID_PARAM_NAME = 'projectId';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(private readonly projectReadCachedService: ProjectReadCachedService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const projectId = request.params[PROJECT_ID_PARAM_NAME];

    if (!userId || !projectId) {
      throw new ForbiddenException('User ID or Project ID not provided');
    }

    const isMember = true;

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this project');
    }

    return true;
  }
}
