import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogEntity } from '../core/entities/log.entity';
import { LogNormalized } from '../core/entities/log.interface';
import { CreateLogDto } from './dto/create-log.dto';
import { LogSerializer } from '../core/entities/log.serializer';
import { sleep } from '../../shared/utils/sleep';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getOurEnv, OurEnv } from '../../shared/types/our-env.enum';
import { Logger } from '@logdash/js-sdk';

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

  // @Cron(CronExpression.EVERY_SECOND)
  public async simulateOneSecondTraffic(): Promise<void> {
    if (process.env.NODE_ENV === 'test' || getOurEnv() === OurEnv.Prod) {
      return;
    }

    const logsPerSecond = 1;

    const intervalBetweenLogs = 1000 / logsPerSecond;

    for (let i = 0; i < logsPerSecond; i++) {
      this.logger.log('Stress test log');
      await sleep(intervalBetweenLogs);
    }
  }
}
