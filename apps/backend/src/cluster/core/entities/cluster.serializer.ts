import { ProjectNormalized } from '../../../project/core/entities/project.interface';
import { ClusterEntity } from './cluster.entity';
import { ClusterNormalized, ClusterSerialized } from './cluster.interface';
import { ClusterFeature } from '../enums/cluster-feature.enum';
import { PublicDashboardNormalized } from '../../../public-dashboard/core/entities/public-dashboard.interface';

export class ClusterSerializer {
  public static normalize(entity: ClusterEntity): ClusterNormalized {
    return {
      id: entity._id.toString(),
      creatorId: entity.creatorId,
      tier: entity.tier,
      members: entity.members,
      name: entity.name,
      roles: entity.roles,
    };
  }

  public static normalizeMany(entities: ClusterEntity[]): ClusterNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(
    normalizedCluster: ClusterNormalized,
    params?: {
      projects?: ProjectNormalized[];
      features?: ClusterFeature[];
      publicDashboards?: PublicDashboardNormalized[];
    },
  ): ClusterSerialized {
    return {
      id: normalizedCluster.id,
      creatorId: normalizedCluster.creatorId,
      tier: normalizedCluster.tier,
      members: normalizedCluster.members,
      name: normalizedCluster.name,
      projects: params?.projects
        ? params.projects.map((project) => ({
            id: project.id,
            name: project.name,
          }))
        : undefined,
      features: params?.features,
      publicDashboards: params?.publicDashboards
        ? params.publicDashboards.map((publicDashboard) => ({
            id: publicDashboard.id,
            name: publicDashboard.name,
            isPublic: publicDashboard.isPublic,
          }))
        : undefined,
      roles: normalizedCluster.roles,
    };
  }

  public static serializeMany(
    normalizedClusters: ClusterNormalized[],
    params?: {
      projectsMap?: Record<string, ProjectNormalized[]>;
      featuresMap?: Record<string, ClusterFeature[]>;
      publicDashboardsMap?: Record<string, PublicDashboardNormalized[]>;
    },
  ): ClusterSerialized[] {
    return normalizedClusters.map((entity) =>
      this.serialize(entity, {
        projects: params?.projectsMap?.[entity.id],
        features: params?.featuresMap?.[entity.id],
        publicDashboards: params?.publicDashboardsMap?.[entity.id],
      }),
    );
  }
}
