import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ProjectReadCachedService } from '../../../project/read/project-read-cached.service';
import { getEnvConfig } from '../../../shared/configs/env-configs';
import { ClusterReadCachedService } from '../../read/cluster-read-cached.service';

const CLUSTER_ID_PARAM_NAME = 'clusterId';
const PROJECT_ID_PARAM_NAME = 'projectId';

@Injectable()
export class ClusterMemberGuard implements CanActivate {
  constructor(
    private readonly clusterReadCachedService: ClusterReadCachedService,
    private readonly projectReadCachedService: ProjectReadCachedService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    const clusterIdFromParams = request.params[CLUSTER_ID_PARAM_NAME];
    const projectIdFromParams = request.params[PROJECT_ID_PARAM_NAME];

    if (projectIdFromParams === getEnvConfig().demo.projectId) {
      return true;
    }

    if (!userId) {
      throw new ForbiddenException('User ID not provided');
    }

    if (!clusterIdFromParams && !projectIdFromParams) {
      throw new ForbiddenException('Cluster ID or project ID not provided');
    }

    if (clusterIdFromParams) {
      return this.checkForClusterId({
        clusterId: clusterIdFromParams,
        userId,
      });
    }

    if (projectIdFromParams) {
      return this.checkForProjectId({
        projectId: projectIdFromParams,
        userId,
      });
    }

    throw new ForbiddenException('Invalid request');
  }

  private async checkForProjectId(dto: { projectId: string; userId: string }): Promise<boolean> {
    const clusterId = await this.projectReadCachedService.readClusterId(dto.projectId);

    const isMember = await this.clusterReadCachedService.userIsMember({
      clusterId,
      userId: dto.userId,
    });

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    return true;
  }

  private async checkForClusterId(dto: { clusterId: string; userId: string }): Promise<boolean> {
    const isMember = await this.clusterReadCachedService.userIsMember({
      clusterId: dto.clusterId,
      userId: dto.userId,
    });

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this cluster');
    }

    return true;
  }
}
