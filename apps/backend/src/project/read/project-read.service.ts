import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  public async readManyByIds(projectIds: string[]): Promise<ProjectNormalized[]> {
    const projects = await this.model.find({
      _id: { $in: projectIds.map((id) => new Types.ObjectId(id)) },
    });

    return projects.map((project) => ProjectSerializer.normalize(project));
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

  public async readManyByTiers(tiers: ProjectTier[]): Promise<ProjectNormalized[]> {
    const projects = await this.model.find({ tier: { $in: tiers } });

    return projects.map((project) => ProjectSerializer.normalize(project));
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
