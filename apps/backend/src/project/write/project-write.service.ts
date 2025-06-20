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
import { Actor } from '../../audit-log/core/enums/actor.enum';
import { AuditLogEntityAction } from '../../audit-log/core/enums/audit-log-actions.enum';
import { RelatedDomain } from '../../audit-log/core/enums/related-domain.enum';
import { AuditLog } from '../../audit-log/creation/audit-log-creation.service';

@Injectable()
export class ProjectWriteService {
  constructor(
    @InjectModel(ProjectEntity.name) private model: Model<ProjectEntity>,
    private readonly projectEventEmitter: ProjectEventEmitter,
    private readonly metrics: Metrics,
    private readonly auditLog: AuditLog,
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

    void this.auditLog.create({
      userId: dto.userId,
      actor: Actor.User,
      action: AuditLogEntityAction.Created,
      relatedDomain: RelatedDomain.Project,
      relatedEntityId: projectNormalized.id,
    });

    this.metrics.mutate('projectsCreated', 1);

    return projectNormalized;
  }

  public async writeCurrentIndexMany(dto: Record<string, number>): Promise<void> {
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

  public async updateProject(dto: UpdateProjectDto, actorUserId?: string): Promise<void> {
    const updateQuery = this.constructUpdateQuery(dto);

    if (actorUserId) {
      void this.auditLog.create({
        userId: actorUserId,
        actor: actorUserId ? Actor.User : Actor.System,
        action: AuditLogEntityAction.Updated,
        relatedDomain: RelatedDomain.Project,
        relatedEntityId: dto.id,
      });
    }

    await this.model.updateOne({ _id: new Types.ObjectId(dto.id) }, updateQuery);
  }

  public async updateLastDeletionIndex(
    projectId: string,
    lastDeletionIndex: number,
  ): Promise<void> {
    await this.model.updateOne(
      { _id: new Types.ObjectId(projectId) },
      {
        'logValues.lastDeletionIndex': lastDeletionIndex,
      },
    );
  }

  public async updateTiersByCreatorId(creatorId: string, tier: ProjectTier): Promise<void> {
    const projects = await this.model.find({ creatorId });

    projects.forEach((project) => {
      void this.auditLog.create({
        userId: project.creatorId,
        actor: Actor.System,
        action: AuditLogEntityAction.Updated,
        relatedDomain: RelatedDomain.Project,
        relatedEntityId: project.id,
        description: `Updated tier to ${tier} because user tier changed`,
      });
    });

    await this.model.updateMany({ creatorId }, { tier });
  }

  private constructUpdateQuery(dto: UpdateProjectDto): UpdateQuery<ProjectEntity> {
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

    return updateQuery;
  }

  public async delete(projectId: string, actorUserId?: string): Promise<void> {
    await this.auditLog.create({
      userId: actorUserId,
      actor: actorUserId ? Actor.User : Actor.System,
      action: AuditLogEntityAction.Deleted,
      relatedDomain: RelatedDomain.Project,
      relatedEntityId: projectId,
    });

    await this.model.deleteOne({ _id: new Types.ObjectId(projectId) });
  }
}
