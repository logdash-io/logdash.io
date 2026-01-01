import { Module } from '@nestjs/common';
import { ProjectReadService } from './project-read.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectEntity, ProjectSchema } from '../core/entities/project.entity';
import { ProjectReadCachedService } from './project-read-cached.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ProjectEntity.name, schema: ProjectSchema }])],
  providers: [ProjectReadService, ProjectReadCachedService],
  exports: [ProjectReadService, ProjectReadCachedService],
})
export class ProjectReadModule {}
