import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { RequireScope } from '../../auth/core/decorators/require-scope.decorator';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';
import { Action } from '../../personal-api-key/core/enums/action.enum';
import { ApiKeyReadService } from '../read/api-key-read.service';
import { ApiKeyWriteService } from '../write/api-key-write.service';
import { ApiKeySerialized, ClusterIngestKeySerialized } from './entities/api-key.interface';
import { ApiKeySerializer } from './entities/api-key.serializer';

@Controller('')
@ApiTags('Api keys')
export class ApiKeyCoreController {
  constructor(
    private readonly apiKeyReadService: ApiKeyReadService,
    private readonly apiKeyWriteService: ApiKeyWriteService,
  ) {}

  @ApiBearerAuth()
  @Get('projects/:projectId/api_keys')
  @ApiResponse({ type: ApiKeySerialized, isArray: true })
  @UseGuards(ClusterMemberGuard)
  public async getProjectApiKeys(
    @Param('projectId') projectId: string,
  ): Promise<ApiKeySerialized[]> {
    const apiKeys = await this.apiKeyReadService.readApiKeysByProjectId(projectId);

    return apiKeys.map((apiKey) => ApiKeySerializer.serialize(apiKey));
  }

  @ApiBearerAuth()
  @Get('clusters/:clusterId/ingest-key')
  @ApiResponse({ type: ClusterIngestKeySerialized })
  @UseGuards(ClusterMemberGuard)
  @RequireScope(Resource.Clusters, Action.Read)
  public async getClusterIngestKey(
    @Param('clusterId') clusterId: string,
  ): Promise<ClusterIngestKeySerialized> {
    const apiKey = await this.apiKeyWriteService.ensureClusterKey(clusterId);

    return { value: apiKey.value };
  }
}
