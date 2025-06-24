import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { LogEntity } from '../core/entities/log.entity';
import { LogNormalized } from '../core/entities/log.interface';
import { LogSerializer } from '../core/entities/log.serializer';
import { LogReadDirection } from '../core/enums/log-read-direction.enum';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class LogReadService {
  constructor(
    @InjectModel(LogEntity.name) private logModel: Model<LogEntity>,
    private logger: Logger,
  ) {}

  public async existsForProject(projectId: string): Promise<boolean> {
    const result = await this.logModel.exists({ projectId });
    return result !== null;
  }

  public async readById(id: string): Promise<LogNormalized> {
    const log = await this.logModel.findById(id).lean<LogEntity>().exec();

    if (!log) {
      throw new Error('Log not found');
    }

    return LogSerializer.normalize(log);
  }

  public async readMany(dto: {
    direction?: LogReadDirection;
    lastId?: string;
    limit: number;
    projectId: string;
  }): Promise<LogNormalized[]> {
    if (dto.direction) {
      const log = await this.getIndexOfLog(dto.lastId!);

      const findQuery: FilterQuery<LogEntity> = {
        projectId: dto.projectId,
      };

      if (dto.direction === LogReadDirection.Before) {
        findQuery.index = { $lt: log };
      }

      if (dto.direction === LogReadDirection.After) {
        findQuery.index = { $gt: log };
      }

      if (dto.direction === LogReadDirection.Before) {
        findQuery.index = { $lt: log };
      }

      const logs = await this.logModel
        .find(findQuery)
        .sort({ index: dto.direction === LogReadDirection.Before ? -1 : 1 })
        .lean<LogEntity[]>()
        .limit(dto.limit)
        .exec();

      return logs.map((log) => LogSerializer.normalize(log));
    }

    const findQuery: FilterQuery<LogEntity> = {};

    if (dto.projectId) {
      findQuery.projectId = dto.projectId;
    }

    const logs = await this.logModel
      .find(findQuery)
      .sort({ index: -1 })
      .lean<LogEntity[]>()
      .limit(dto.limit)
      .exec();

    return logs.map((log) => LogSerializer.normalize(log));
  }

  private async getIndexOfLog(logId: string): Promise<number> {
    const log = await this.logModel.findOne({ _id: new Types.ObjectId(logId) }, { index: 1 });

    if (!log) {
      this.logger.error(`Log not found`, { logId });
      throw new Error(`Log with id ${logId} not found`);
    }

    return log.index;
  }
}
