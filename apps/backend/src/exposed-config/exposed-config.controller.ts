import { Controller, Get } from '@nestjs/common';
import { ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/core/decorators/is-public';
import { ProjectPlanConfigs } from '../shared/configs/project-plan-configs';
import { UserPlanConfigs } from '../shared/configs/user-plan-configs';
import { getEnvConfig } from '../shared/configs/env-configs';

export class DemoConfigResponnse {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  clusterId: string;
}

@ApiTags('Exposed config')
@Controller()
export class ExposedConfigController {
  @Get('/exposed_config')
  @Public()
  public async getExposedConfig() {
    return {
      projectPlanConfigs: ProjectPlanConfigs,
      userPlanConfigs: UserPlanConfigs,
    };
  }

  @Get('/demo')
  @ApiResponse({ type: DemoConfigResponnse })
  @Public()
  public async demo(): Promise<DemoConfigResponnse> {
    const config = getEnvConfig().demo;

    return {
      projectId: config.projectId,
      clusterId: config.clusterId,
    };
  }
}
