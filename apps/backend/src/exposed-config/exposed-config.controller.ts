import { BadRequestException, Controller, Get, InternalServerErrorException } from '@nestjs/common';
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

  @Get('/flaky_route')
  @Public()
  public async flakyRoute() {
    // First 50/50 split between success and errors
    const isSuccess = Math.random() < 0.5;

    if (isSuccess) {
      return { message: 'OK' };
    }

    // For the error cases, split remaining 50% into three equal parts
    const errorType = Math.floor(Math.random() * 3);

    switch (errorType) {
      case 0:
        await new Promise((resolve) => setTimeout(resolve, 15000));
        return { message: 'OK' };

      case 1:
        throw new BadRequestException('PIETY PAPIEZA 404 CUSTOM MESSAGE');

      case 2:
        throw new InternalServerErrorException('PIETY PAPIEZA 500 CUSTOM MESSAGE');
    }
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
