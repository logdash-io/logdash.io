import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProjectEntity } from '../../src/project/core/entities/project.entity';
import { getEnvConfig } from '../../src/shared/configs/env-configs';
import { LogEntity } from '../../src/log/core/entities/log.entity';
import { ProjectSerializer } from '../../src/project/core/entities/project.serializer';
import { UserEntity } from '../../src/user/core/entities/user.entity';
import { ProjectSerialized } from '../../src/project/core/entities/project.interface';
import { LogLevel } from '../../src/log/core/enums/log-level.enum';

export class DemoUtils {
  private readonly userModel: Model<UserEntity>;
  private readonly projectModel: Model<ProjectEntity>;
  private readonly logModel: Model<LogEntity>;

  constructor(private readonly app: INestApplication<any>) {
    this.userModel = this.app.get(getModelToken(UserEntity.name));
    this.projectModel = this.app.get(getModelToken(ProjectEntity.name));
    this.logModel = this.app.get(getModelToken(LogEntity.name));
  }

  public async setupDemoProject(): Promise<{
    project: ProjectSerialized;
  }> {
    const project = await this.projectModel.create({
      _id: new Types.ObjectId(getEnvConfig().demo.projectId),
      name: 'demo project',
    });

    const log = await this.logModel.create({
      message: 'Hello',
      projectId: project._id,
      index: 0,
      createdAt: new Date(),
      level: LogLevel.Info,
    });

    return {
      project: ProjectSerializer.serialize(
        ProjectSerializer.normalize(project),
      ),
    };
  }
}
