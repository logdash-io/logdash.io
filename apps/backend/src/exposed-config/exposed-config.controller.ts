import { Controller, Get } from '@nestjs/common';
import { ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/core/decorators/is-public';
import { ProjectPlanConfigs } from '../shared/configs/project-plan-configs';
import { UserPlanConfigs } from '../shared/configs/user-plan-configs';
import { getEnvConfig } from '../shared/configs/env-configs';
import { ClusterPlanConfigs } from '../shared/configs/cluster-plan-configs';

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
  public getExposedConfig(): {
    projectPlanConfigs: ProjectPlanConfigs;
    clusterPlanConfigs: ClusterPlanConfigs;
    userPlanConfigs: UserPlanConfigs;
  } {
    return {
      projectPlanConfigs: ProjectPlanConfigs,
      clusterPlanConfigs: ClusterPlanConfigs,
      userPlanConfigs: UserPlanConfigs,
    };
  }

  @Get('/demo')
  @ApiResponse({ type: DemoConfigResponnse })
  @Public()
  public demo(): DemoConfigResponnse {
    const config = getEnvConfig().demo;

    return {
      projectId: config.projectId,
      clusterId: config.clusterId,
    };
  }
}
