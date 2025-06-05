import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProjectEntity } from '../core/entities/project.entity';
import { ProjectNormalized } from '../core/entities/project.interface';
import { ProjectSerializer } from '../core/entities/project.serializer';
import { ProjectTier } from '../core/enums/project-tier.enum';

@Injectable()
export class ProjectReadService {
  constructor(@InjectModel(ProjectEntity.name) private model: Model<ProjectEntity>) {}

  public async readById(projectId: string): Promise<ProjectNormalized | null> {
    const project = await this.model.findById(projectId);

    if (!project) {
      return null;
    }

    return ProjectSerializer.normalize(project);
  }

  public async readByUserIdInMembers(userId: string): Promise<ProjectNormalized[]> {
    const projects = await this.model.find({ members: userId });

    return projects.map((project) => ProjectSerializer.normalize(project));
  }

  public async readByClusterId(clusterId: string): Promise<ProjectNormalized[]> {
    const projects = await this.model.find({ clusterId });

    return projects.map((project) => ProjectSerializer.normalize(project));
  }

  public async readCurrentIndexMany(projectIds: string[]): Promise<Record<string, number>> {
    const projects = await this.model.find(
      { _id: { $in: projectIds } },
      { 'logValues.currentIndex': 1 },
    );

    const result: Record<string, number> = {};

    for (const project of projects) {
      result[project._id.toString()] = project.logValues.currentIndex;
    }

    return result;
  }

  public async readByCreatorId(creatorId: string): Promise<ProjectNormalized[]> {
    const projects = await this.model.find({ creatorId });

    return projects.map((project) => ProjectSerializer.normalize(project));
  }

  public async readProjectsForLogRemoval(): Promise<
    {
      projectId: string;
      currentIndex: number;
      lastDeletionIndex: number;
      tier: ProjectTier;
    }[]
  > {
    const projects = await this.model.find(
      {},
      {
        'logValues.currentIndex': 1,
        'logValues.lastDeletionIndex': 1,
        tier: 1,
      },
    );

    return projects.map((project) => ({
      projectId: project._id.toString(),
      currentIndex: project.logValues.currentIndex,
      lastDeletionIndex: project.logValues.lastDeletionIndex,
      tier: project.tier,
    }));
  }

  // optimize: can be optimized to directly send log removal condition to the db
  public async *getProjectForLogRemovalCursor(): AsyncGenerator<{
    projectId: string;
    currentIndex: number;
    lastDeletionIndex: number;
    tier: ProjectTier;
  }> {
    const cursor = this.model
      .find(
        {},
        {
          'logValues.currentIndex': 1,
          'logValues.lastDeletionIndex': 1,
          tier: 1,
        },
      )
      .cursor();

    for await (const project of cursor) {
      yield {
        projectId: project._id.toString(),
        currentIndex: project.logValues.currentIndex,
        lastDeletionIndex: project.logValues.lastDeletionIndex,
        tier: project.tier,
      };
    }
  }

  public async *getProjectsForLogMetricRemoval(): AsyncGenerator<
    {
      id: string;
      tier: ProjectTier;
    }[]
  > {
    const cursor = this.model.find().cursor();

    const batchSize = 20;

    const batch: {
      id: string;
      tier: ProjectTier;
    }[] = [];

    for await (const project of cursor) {
      batch.push({
        id: project._id.toString(),
        tier: project.tier,
      });

      if (batch.length === batchSize) {
        yield batch;
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      yield batch;
    }
  }

  public async countProjectsByCreatorId(creatorId: string): Promise<number> {
    return this.model.countDocuments({ creatorId });
  }

  public async *readAllCoursor(): AsyncGenerator<ProjectNormalized> {
    const cursor = this.model.find().cursor();

    for await (const project of cursor) {
      yield ProjectSerializer.normalize(project);
    }
  }

  public async readGroupedByClusterMany(
    clusterIds: string[],
  ): Promise<Record<string, ProjectNormalized[]>> {
    const projects = await this.model.find({ clusterId: { $in: clusterIds } });

    const result: Record<string, ProjectNormalized[]> = {};

    for (const project of projects) {
      if (!result[project.clusterId]) {
        result[project.clusterId] = [];
      }

      result[project.clusterId].push(ProjectSerializer.normalize(project));
    }

    return result;
  }
}
