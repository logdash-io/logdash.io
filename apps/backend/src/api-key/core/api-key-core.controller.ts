import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeySerialized } from './entities/api-key.interface';
import { ApiKeySerializer } from './entities/api-key.serializer';
import { ApiKeyReadService } from '../read/api-key-read.service';
import { ClusterMemberGuard } from '../../cluster/guards/cluster-member/cluster-member.guard';

@Controller('')
@ApiTags('Api keys')
export class ApiKeyCoreController {
  constructor(private readonly apiKeyReadService: ApiKeyReadService) {}

  @Get('projects/:projectId/api_keys')
  @ApiResponse({ type: ApiKeySerialized, isArray: true })
  @UseGuards(ClusterMemberGuard)
  public async getProjectApiKeys(
    @Param('projectId') projectId: string,
  ): Promise<ApiKeySerialized[]> {
    const apiKeys =
      await this.apiKeyReadService.readApiKeysByProjectId(projectId);

    return apiKeys.map((apiKey) => ApiKeySerializer.serialize(apiKey));
  }
}
