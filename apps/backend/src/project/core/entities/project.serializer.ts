import { RateLimit } from '../../../shared/responses/rate-limit.response';
import { ProjectFeature } from '../enums/project-feature.enum';
import { ProjectNormalized, ProjectSerialized } from './project.interface';

export class ProjectSerializer {
  public static normalize(entity): ProjectNormalized {
    return {
      id: entity._id.toString(),
      name: entity.name,
      clusterId: entity.clusterId,
      members: entity.members,
      creatorId: entity.creatorId,
      tier: entity.tier,
    };
  }

  public static normalizeMany(entities: any[]): ProjectNormalized[] {
    return entities.map((entity) => this.normalize(entity));
  }

  public static serialize(
    normalized: ProjectNormalized,
    params?: {
      features?: ProjectFeature[];
      rateLimits?: RateLimit[];
    },
  ): ProjectSerialized {
    return {
      ...normalized,
      features: params?.features,
      rateLimits: params?.rateLimits,
    };
  }

  public static serializeMany(
    normalized: ProjectNormalized[],
    params?: {
      featuresMap?: Record<string, ProjectFeature[]>;
      rateLimitsMap?: Record<string, RateLimit[]>;
    },
  ): ProjectSerialized[] {
    return normalized.map((entity) =>
      this.serialize(entity, {
        features: params?.featuresMap?.[entity.id],
        rateLimits: params?.rateLimitsMap?.[entity.id],
      }),
    );
  }
}
