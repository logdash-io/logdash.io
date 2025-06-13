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
    const randomNumber = Math.floor(Math.random() * 4);

    switch (randomNumber) {
      case 0:
        return { message: 'OK' };

      case 1:
        await new Promise((resolve) => setTimeout(resolve, 15000));
        return { message: 'OK' };

      case 2:
        throw new BadRequestException('PIETY PAPIEZA 404 CUSTOM MESSAGE');

      case 3:
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
