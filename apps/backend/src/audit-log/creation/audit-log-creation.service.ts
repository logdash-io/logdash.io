import { Inject, Injectable } from '@nestjs/common';
import { RedisService, TtlOverwriteStrategy } from '../../shared/redis/redis.service';
import { CreateAuditLogDto } from '../write/dto/create-audit-log.dto';
import { AuditLogWriteService } from '../write/audit-log-write.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { AUDIT_LOGS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { RelatedDomain } from '../core/enums/related-domain.enum';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';
import { ClusterReadCachedService } from '../../cluster/read/cluster-read-cached.service';
import { MetricRegisterReadService } from '../../metric-register/read/metric-register-read.service';
import { CustomDomainReadService } from '../../custom-domain/read/custom-domain-read.service';
import { PublicDashboardReadService } from '../../public-dashboard/read/public-dashboard-read.service';

const MAX_AUDIT_LOGS_PER_USER_PER_MINUTE = 60 * 10;

@Injectable()
export class AuditLog {
  constructor(
    private readonly redisService: RedisService,
    @Inject(AUDIT_LOGS_LOGGER) private readonly logger: LogdashLogger,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly clusterReadCachedService: ClusterReadCachedService,
    private readonly metricRegisterReadService: MetricRegisterReadService,
    private readonly auditLogWriteService: AuditLogWriteService,
    private readonly customDomainReadService: CustomDomainReadService,
    private readonly publicDashboardReadService: PublicDashboardReadService,
  ) {}

  public async create(dto: CreateAuditLogDto): Promise<void> {
    try {
      if (dto.userId) {
        return await this.createIfWithinRateLimit(dto);
      }

      const enrichedDto = await this.enrichDtoWithUserId(dto);

      return await this.createIfWithinRateLimit(enrichedDto);
    } catch (error) {
      this.logger.error('Error creating audit log', {
        error: error.message,
        dto,
      });
    }
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
          userId: cluster.creatorId,
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

    // public dashboard
    if (dto.relatedDomain === RelatedDomain.PublicDashboard) {
      const publicDashboard = await this.publicDashboardReadService.readById(dto.relatedEntityId);

      if (!publicDashboard) {
        return dto;
      }

      const cluster = await this.clusterReadCachedService.readById(publicDashboard.clusterId);

      if (!cluster) {
        return dto;
      }

      return {
        ...dto,
        userId: cluster.creatorId,
      };
    }

    // custom domain
    if (dto.relatedDomain === RelatedDomain.CustomDomain) {
      const customDomain = await this.customDomainReadService.readById(dto.relatedEntityId);

      if (customDomain) {
        const publicDashboard = await this.publicDashboardReadService.readById(
          customDomain.publicDashboardId,
        );

        if (!publicDashboard) {
          return dto;
        }

        const cluster = await this.clusterReadCachedService.readById(publicDashboard.clusterId);

        if (!cluster) {
          return dto;
        }

        return {
          ...dto,
          userId: cluster.creatorId,
        };
      }
    }

    return dto;
  }

  private async isWithinRateLimit(userId: string): Promise<boolean> {
    const key = `audit-log:rate-limit:${userId}`;
    const count = await this.redisService.increment(key, {
      ttlOverwriteStrategy: TtlOverwriteStrategy.SetOnlyIfNoExpiry,
      ttlSeconds: 60,
    });

    return Number(count) <= MAX_AUDIT_LOGS_PER_USER_PER_MINUTE;
  }
}
