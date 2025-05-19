import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectEntity, ProjectSchema } from '../core/entities/project.entity';
import { ProjectWriteService } from './project-write.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProjectEntity.name, schema: ProjectSchema },
    ]),
  ],
  providers: [ProjectWriteService],
  exports: [ProjectWriteService],
})
export class ProjectWriteModule {}
