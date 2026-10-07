import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model } from 'mongoose';
import { HttpMonitorEntity } from '../core/entities/http-monitor.entity';
import { HttpMonitorNormalized } from '../core/entities/http-monitor.interface';
import { HttpMonitorSerializer } from '../core/entities/http-monitor.serializer';
import { HttpMonitorMode } from '../core/enums/http-monitor-mode.enum';

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
    const positions = new Map(ids.map((id, index) => [id, index]));

    return HttpMonitorSerializer.normalizeMany(entities).sort(
      (a, b) => (positions.get(a.id) ?? 0) - (positions.get(b.id) ?? 0),
    );
  }

  async readByProjectId(projectId: string): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ projectId })
      .sort({ createdAt: -1 })
      .lean<HttpMonitorEntity[]>()
      .exec();

    return HttpMonitorSerializer.normalizeMany(entities);
  }

  public async readByClusterId(clusterId: string): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ clusterId })
      .lean<HttpMonitorEntity[]>()
      .exec();

    return HttpMonitorSerializer.normalizeMany(entities);
  }

  public async readClaimedByProjectId(projectId: string): Promise<HttpMonitorNormalized[]> {
    return this.readClaimed({ projectId });
  }

  public async readClaimedByProjectIds(projectIds: string[]): Promise<HttpMonitorNormalized[]> {
    return this.readClaimed({ projectId: { $in: projectIds } });
  }

  public async readClaimedByClusterId(clusterId: string): Promise<HttpMonitorNormalized[]> {
    return this.readClaimed({ clusterId });
  }

  public async readClaimedByClusterIds(clusterIds: string[]): Promise<HttpMonitorNormalized[]> {
    return this.readClaimed({ clusterId: { $in: clusterIds } });
  }

  public async countClaimedByClusterIds(clusterIds: string[]): Promise<number> {
    return this.httpMonitorModel
      .countDocuments({ clusterId: { $in: clusterIds }, claimed: true })
      .lean()
      .exec();
  }

  public async countNotClaimedByClusterId(clusterId: string): Promise<number> {
    return this.httpMonitorModel.countDocuments({ clusterId, claimed: false }).lean().exec();
  }

  public async existsClaimedForProject(projectId: string): Promise<boolean> {
    const result = await this.httpMonitorModel.exists({ projectId, claimed: true });
    return result !== null;
  }

  public async *readManyClaimedByClusterIdsCursorWithMode(
    clusterIds: string[],
    mode: HttpMonitorMode,
  ): AsyncGenerator<HttpMonitorNormalized> {
    const cursor = this.httpMonitorModel
      .find({ clusterId: { $in: clusterIds }, mode, claimed: true })
      .sort({ createdAt: -1 })
      .cursor();

    for await (const entity of cursor) {
      yield HttpMonitorSerializer.normalize(entity);
    }
  }

  public async *readManyUnclaimedCursorWithMode(
    mode: string,
  ): AsyncGenerator<HttpMonitorNormalized> {
    const cursor = this.httpMonitorModel
      .find({ claimed: false, mode: mode as HttpMonitorMode })
      .sort({ createdAt: -1 })
      .cursor();

    for await (const entity of cursor) {
      yield HttpMonitorSerializer.normalize(entity);
    }
  }

  public async readManyByClusterIdsAndMode(
    clusterIds: string[],
    mode: HttpMonitorMode,
  ): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ clusterId: { $in: clusterIds }, mode })
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

  private async readClaimed(
    filter: QueryFilter<HttpMonitorEntity>,
  ): Promise<HttpMonitorNormalized[]> {
    const entities = await this.httpMonitorModel
      .find({ ...filter, claimed: true })
      .sort({ createdAt: -1 })
      .lean<HttpMonitorEntity[]>()
      .exec();

    return HttpMonitorSerializer.normalizeMany(entities);
  }
}
