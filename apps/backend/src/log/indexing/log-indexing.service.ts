import { Injectable } from '@nestjs/common';
import { ProjectReadService } from '../../project/read/project-read.service';
import { CreateLogDto } from '../write/dto/create-log.dto';
import { groupBy } from '../../shared/utils/group-by';
import { ProjectWriteService } from '../../project/write/project-write.service';

@Injectable()
export class LogIndexingService {
  constructor(
    private readonly projectReadService: ProjectReadService,
    private readonly projectWriteService: ProjectWriteService,
  ) {}

  public async enrichWithIndexes(dtos: CreateLogDto[]): Promise<CreateLogDto[]> {
    const projectIds = dtos.map((dto) => dto.projectId);
    const uniqueProjectIds = [...new Set(projectIds)];

    const indexes = await this.projectReadService.readCurrentIndexMany(uniqueProjectIds);

    const groupedByProjectId = groupBy(dtos, 'projectId');

    const numberOfLogsPerProject = Object.keys(groupedByProjectId).map((projectId) => {
      return {
        projectId,
        count: groupedByProjectId[projectId].length,
      };
    });

    const updateIndexesDto: Record<string, number> = {};

    for (const { projectId, count } of numberOfLogsPerProject) {
      updateIndexesDto[projectId] = indexes[projectId] + count;
    }

    await this.projectWriteService.writeCurrentIndexMany(updateIndexesDto);

    const dtosToReturn: CreateLogDto[] = [];

    // enrich with index
    for (const projectId of uniqueProjectIds) {
      const projectDtos = groupedByProjectId[projectId];

      dtosToReturn.push(...this.enrichBelongingToSameProject(projectDtos, indexes[projectId]));
    }

    return dtosToReturn;
  }

  private enrichBelongingToSameProject(dtos: CreateLogDto[], initialIndex: number): CreateLogDto[] {
    dtos.sort((a, b) => {
      if (a.createdAt < b.createdAt) return -1;
      if (a.createdAt > b.createdAt) return 1;
      if (a.sequenceNumber !== undefined && b.sequenceNumber !== undefined) {
        return a.sequenceNumber - b.sequenceNumber;
      }
      return 0;
    });

    for (const dto of dtos) {
      dto.index = initialIndex;
      initialIndex++;
    }

    return dtos;
  }
}
