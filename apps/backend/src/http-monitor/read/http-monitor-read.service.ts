import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpMonitorEntity } from '../core/entities/http-monitor.entity';
import { HttpMonitorNormalized } from '../core/entities/http-monitor.interface';
import { HttpMonitorSerializer } from '../core/entities/http-monitor.serializer';

@Injectable()
export class HttpMonitorReadService {
  constructor(
    @InjectModel(HttpMonitorEntity.name)
    private readonly httpMonitorModel: Model<HttpMonitorEntity>,
  ) {}

  public async readById(id: string): Promise<HttpMonitorNormalized | null> {
    const entity = await this.httpMonitorModel.findById(id).lean<HttpMonitorEntity>().exec();

    if (!entity) {
      return null;
    }

    return HttpMonitorSerializer.normalize(entity);
  }

  public async readByIdOrThrow(id: string): Promise<HttpMonitorNormalized> {
    const monitor = await this.readById(id);
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }
    return monitor;
  }

  async readManyByIds(ids: string[]): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ _id: { $in: ids } })
      .lean<HttpMonitorEntity[]>()
      .exec();
    return HttpMonitorSerializer.normalizeMany(entities);
  }

  async readClaimedByProjectId(projectId: string): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ projectId, claimed: true })
      .sort({ createdAt: -1 })
      .lean<HttpMonitorEntity[]>()
      .exec();

    return HttpMonitorSerializer.normalizeMany(entities);
  }

  public async readClaimedByProjectIds(projectIds: string[]): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ projectId: { $in: projectIds }, claimed: true })
      .sort({ createdAt: -1 })
      .lean<HttpMonitorEntity[]>()
      .exec();

    return HttpMonitorSerializer.normalizeMany(entities);
  }

  public async countClaimedByProjectId(projectId: string): Promise<number> {
    return this.httpMonitorModel.countDocuments({ projectId, claimed: true }).lean().exec();
  }

  public async countNotClaimedByProjectId(projectId: string): Promise<number> {
    return this.httpMonitorModel.countDocuments({ projectId, claimed: false }).lean().exec();
  }

  public async countAll(): Promise<number> {
    return this.httpMonitorModel.countDocuments().lean().exec();
  }

  public async existsClaimedForProject(projectId: string): Promise<boolean> {
    const result = await this.httpMonitorModel.exists({ projectId, claimed: true });
    return result !== null;
  }

  public async *readManyClaimedByProjectIdsCursorWithMode(
    projectIds: string[],
    mode: string,
  ): AsyncGenerator<HttpMonitorNormalized> {
    const cursor = this.httpMonitorModel
      .find({ projectId: { $in: projectIds }, mode, claimed: true })
      .sort({ createdAt: -1 })
      .cursor();

    for await (const entity of cursor) {
      yield HttpMonitorSerializer.normalize(entity);
    }
  }

  public async readManyByProjectIdsAndMode(
    projectIds: string[],
    mode: string,
  ): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ projectId: { $in: projectIds }, mode })
      .sort({ createdAt: -1 })
      .lean<HttpMonitorEntity[]>()
      .exec();

    return HttpMonitorSerializer.normalizeMany(entities);
  }

  public async readManyClaimedByProjectIdsAndMode(
    projectIds: string[],
    mode: string,
  ): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ projectId: { $in: projectIds }, mode, claimed: true })
      .sort({ createdAt: -1 })
      .lean<HttpMonitorEntity[]>()
      .exec();

    return HttpMonitorSerializer.normalizeMany(entities);
  }

  public async readUnclaimedOlderThan(cutoffDate: Date): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ claimed: false, createdAt: { $lt: cutoffDate } })
      .lean<HttpMonitorEntity[]>()
      .exec();

    return HttpMonitorSerializer.normalizeMany(entities);
  }
}
