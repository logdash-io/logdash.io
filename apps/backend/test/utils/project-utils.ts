import { INestApplication } from '@nestjs/common';

import { ProjectNormalized } from '../../src/project/core/entities/project.interface';
import { getModelToken } from '@nestjs/mongoose';
import { ProjectEntity } from '../../src/project/core/entities/project.entity';
import { Model } from 'mongoose';
import { ProjectSerializer } from '../../src/project/core/entities/project.serializer';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';
import { ApiKeyEntity } from '../../src/api-key/core/entities/api-key.entity';

export class ProjectUtils {
  private projectModel: Model<ProjectEntity>;
  private apiKeyModel: Model<ApiKeyEntity>;

  constructor(private readonly app: INestApplication<any>) {
    this.projectModel = this.app.get(getModelToken(ProjectEntity.name));
    this.apiKeyModel = this.app.get(getModelToken(ApiKeyEntity.name));
  }

  public async getProject(): Promise<ProjectNormalized> {
    return ProjectSerializer.normalize(await this.projectModel.findOne());
  }

  public async createDefaultProject(params?: {
    userId?: string;
    clusterId?: string;
    tier?: ProjectTier;
  }): Promise<ProjectNormalized & { apiKey: string }> {
    const project = await this.projectModel.create({
      name: 'Default project',
      creatorId: params?.userId,
      logValues: {
        currentIndex: 0,
        lastDeletionIndex: 0,
      },
      tier: params?.tier || ProjectTier.Free,
      clusterId: params?.clusterId,
    });

    const apiKey = await this.apiKeyModel.create({
      projectId: project._id,
      value: `some-api-key-${Math.random()}`,
    });

    return { ...ProjectSerializer.normalize(project), apiKey: apiKey.value };
  }
}
