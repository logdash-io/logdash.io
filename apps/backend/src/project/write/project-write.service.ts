import { Injectable } from '@nestjs/common';
import { ProjectEntity } from '../core/entities/project.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectNormalized } from '../core/entities/project.interface';
import { ProjectSerializer } from '../core/entities/project.serializer';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectTier } from '../core/enums/project-tier.enum';
import { ProjectEventEmitter } from '../events/project-event.emitter';
import { Metrics } from '@logdash/js-sdk';

@Injectable()
export class ProjectWriteService {
  constructor(
    @InjectModel(ProjectEntity.name) private model: Model<ProjectEntity>,
    private readonly projectEventEmitter: ProjectEventEmitter,
    private readonly metrics: Metrics,
  ) {}

  public async create(dto: CreateProjectDto): Promise<ProjectNormalized> {
    const project = await this.model.create({
      name: dto.name,
      creatorId: dto.userId,
      logValues: {
        currentIndex: 0,
        lastDeletionIndex: 0,
      },
      tier: dto.tier,
      clusterId: dto.clusterId,
    });

    const projectNormalized = ProjectSerializer.normalize(project);

    this.projectEventEmitter.emitUserAddedToProjectEvent({
      projectId: projectNormalized.id,
      userId: dto.userId,
    });

    this.metrics.mutate('projectsCreated', 1);

    return projectNormalized;
  }

  public async writeCurrentIndexMany(
    dto: Record<string, number>,
  ): Promise<void> {
    await this.model.bulkWrite(
      Object.keys(dto).map((projectId) => ({
        updateOne: {
          filter: { _id: projectId },
          update: { 'logValues.currentIndex': dto[projectId] },
        },
      })),
      { ordered: false },
    );
  }

  public async updateProject(dto: UpdateProjectDto): Promise<void> {
    const updateQuery = this.constructUpdateQuery(dto);

    await this.model.updateOne(
      { _id: new Types.ObjectId(dto.id) },
      updateQuery,
    );
  }

  public async updateTiersByCreatorId(
    creatorId: string,
    tier: ProjectTier,
  ): Promise<void> {
    await this.model.updateMany({ creatorId }, { tier });
  }

  private constructUpdateQuery(
    dto: UpdateProjectDto,
  ): UpdateQuery<ProjectEntity> {
    const updateQuery: UpdateQuery<ProjectEntity> = {};

    if (dto.name) {
      updateQuery.name = dto.name;
    }

    if (dto.creatorId) {
      updateQuery.creatorId = dto.creatorId;
    }

    if (dto.clusterId) {
      updateQuery.clusterId = dto.clusterId;
    }

    if (dto.lastDeletionIndex) {
      updateQuery['logValues.lastDeletionIndex'] = dto.lastDeletionIndex;
    }

    // todo remove that after sync
    if (dto.clearMembers) {
      (updateQuery as any).members = null;
    }

    return updateQuery;
  }

  public async delete(projectId: string): Promise<void> {
    await this.model.deleteOne({ _id: new Types.ObjectId(projectId) });
  }
}
