import { Injectable } from '@nestjs/common';
import { RedisService, TtlOverwriteStrategy } from '../../shared/redis/redis.service';
import { CreateAuditLogDto } from '../write/dto/create-audit-log.dto';
import { AuditLogWriteService } from '../write/audit-log-write.service';
import { Logger } from '@logdash/js-sdk';
import { RelatedDomain } from '../core/enums/related-domain.enum';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';

const MAX_AUDIT_LOGS_PER_USER_PER_MINUTE = 60 * 10;

@Injectable()
export class AuditLog {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: Logger,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly clusterReadCachedService: ClusterReadCachedService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly auditLogWriteService: AuditLogWriteService,
  ) {}

  public async create(dto: CreateAuditLogDto): Promise<void> {
    if (dto.userId) {
      await this.createIfWithinRateLimit(dto);
    }

    const enrichedDto = await this.enrichDtoWithUserId(dto);

    await this.createIfWithinRateLimit(enrichedDto);
  }

  private async createIfWithinRateLimit(dto: CreateAuditLogDto): Promise<void> {
    if (dto.userId || dto.relatedEntityId) {
      const isWithinRateLimit = await this.isWithinRateLimit((dto.userId || dto.relatedEntityId)!);
      if (!isWithinRateLimit) {
        this.logger.error('Tried to create audit log but limit exceeded', {
          dto,
        });
        throw new Error('Rate limit exceeded');
      }
    }

    await this.auditLogWriteService.create(dto);
  }

  private async enrichDtoWithUserId(dto: CreateAuditLogDto): Promise<CreateAuditLogDto> {
    if (dto.userId) {
      return dto;
    }

    if (!dto.relatedEntityId) {
      return dto;
    }

    // project
    if (dto.relatedDomain === RelatedDomain.Project) {
      const project = await this.projectReadCachedService.readProject(dto.relatedEntityId);

      if (project) {
        return {
          ...dto,
          userId: project.creatorId,
        };
      }
    }

    // cluster
    if (dto.relatedDomain === RelatedDomain.Cluster) {
      const cluster = await this.clusterReadCachedService.readById(dto.relatedEntityId);

      if (cluster) {
        return {
          ...dto,
        };
      }
    }

    // metric
    if (dto.relatedDomain === RelatedDomain.Metric) {
      const metricRegisterEntry = await this.metricRegisterReadService.readById(
        dto.relatedEntityId,
      );

      if (metricRegisterEntry) {
        const project = await this.projectReadCachedService.readProject(
          metricRegisterEntry?.projectId,
        );

        return {
          ...dto,
          userId: project?.creatorId,
        };
      }
    }

    return dto;
  }

  private async isWithinRateLimit(userId: string): Promise<boolean> {
    const key = `audit-log:rate-limit:${userId}`;
    const count = await this.redisService.get(key);
    if (!count) {
      await this.redisService.increment(key, {
        ttlOverwriteStrategy: TtlOverwriteStrategy.SetOnlyIfNoExpiry,
        ttlSeconds: 60,
      });
      return true;
    }
    return Number(count) < MAX_AUDIT_LOGS_PER_USER_PER_MINUTE;
  }
}
