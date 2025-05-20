import { ProjectNormalized } from '../../../project/core/entities/project.interface';
import { ClusterEntity } from './cluster.entity';
import { ClusterNormalized, ClusterSerialized } from './cluster.interface';
import { ClusterFeature } from '../enums/cluster-feature.enum';

export class ClusterSerializer {
  public static normalize(entity: ClusterEntity): ClusterNormalized {
    return {
      id: entity._id.toString(),
      creatorId: entity.creatorId,
      tier: entity.tier,
      members: entity.members,
      name: entity.name,
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
    };
  }

  public static serializeMany(
    normalizedClusters: ClusterNormalized[],
    params?: {
      projectsMap?: Record<string, ProjectNormalized[]>;
      featuresMap?: Record<string, ClusterFeature[]>;
    },
  ): ClusterSerialized[] {
    return normalizedClusters.map((entity) =>
      this.serialize(entity, {
        projects: params?.projectsMap?.[entity.id],
        features: params?.featuresMap?.[entity.id],
      }),
    );
  }
}
