import { Logger } from '@logdash/js-sdk';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { getOurEnv, OurEnv } from '../../shared/types/our-env.enum';
import { LogEntity } from '../core/entities/log.entity';
import { LogNormalized } from '../core/entities/log.interface';
import { LogSerializer } from '../core/entities/log.serializer';
import { CreateLogDto } from './dto/create-log.dto';
import { LogWriteClickhouseService } from './log-write.clickhouse-service';

@Injectable()
export class LogWriteService {
  constructor(
    @InjectModel(LogEntity.name) private logModel: Model<LogEntity>,
    private readonly logger: Logger,
  ) {}

  public async create(dto: CreateLogDto): Promise<LogNormalized> {
    const Log = await this.logModel.create({
      createdAt: dto.createdAt.toISOString(),
      message: dto.message,
      level: dto.level,
      projectId: dto.projectId,
      index: dto.index,
    });

    return LogSerializer.normalize(Log);
  }

  public async createMany(dtos: CreateLogDto[]): Promise<void> {
    await this.logModel.insertMany(
      dtos.map((dto) => ({
        _id: dto.id,
        createdAt: dto.createdAt.toISOString(),
        message: dto.message,
        level: dto.level,
        projectId: dto.projectId,
        index: dto.index,
      })),
      { ordered: false },
    );
  }

  public async removeForProjectWithIndexLessThan(projectId: string, index: number): Promise<void> {
    await this.logModel.deleteMany(
      {
        projectId,
        index: { $lt: index },
      },
      { ordered: false },
    );
  }

  public async deleteBelongingToProject(projectId: string): Promise<void> {
    await this.logModel.deleteMany({ projectId });
  }
}
