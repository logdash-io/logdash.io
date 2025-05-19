import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProjectTier } from '../enums/project-tier.enum';

export class LogValues {
  @Prop()
  currentIndex: number;

  @Prop()
  lastDeletionIndex: number;
}

@Schema({ collection: 'projects', timestamps: true })
export class ProjectEntity {
  _id: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  creatorId: string;

  @Prop()
  clusterId: string;

  // todo - remove after sync
  @Prop()
  members: string[];

  @Prop()
  logValues: LogValues;

  @Prop()
  tier: ProjectTier;
}

export type ProjectDocument = HydratedDocument<ProjectEntity>;

export const ProjectSchema = SchemaFactory.createForClass(ProjectEntity);
