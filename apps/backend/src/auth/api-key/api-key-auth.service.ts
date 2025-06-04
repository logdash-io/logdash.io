import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CustomJwtService } from '../custom-jwt/custom-jwt.service';
import { JwtPayloadDto } from '../custom-jwt/dto/jwt-payload.dto';
import { ApiKeyReadCachedService } from '../../api-key/read/api-key-read-cached.service';
import { ProjectReadCachedService } from '../../project/read/project-read-cached.service';

@Injectable()
export class ApiKeyAuthService {
  constructor(
    private readonly apiKeyReadCachedService: ApiKeyReadCachedService,
    private readonly projectReadCachedService: ProjectReadCachedService,
    private readonly customJwtService: CustomJwtService,
  ) {}

  public async authenticateWithApiKey(apiKeyValue: string): Promise<string> {
    const projectId = await this.apiKeyReadCachedService.readProjectId(apiKeyValue);

    if (!projectId) {
      throw new UnauthorizedException('Invalid API key');
    }

    const project = await this.projectReadCachedService.readProject(projectId);

    if (!project) {
      throw new UnauthorizedException('Invalid API key');
    }

    const jwtPayload: JwtPayloadDto = {
      id: project.creatorId,
    };

    return await this.customJwtService.sign(jwtPayload);
  }
}
