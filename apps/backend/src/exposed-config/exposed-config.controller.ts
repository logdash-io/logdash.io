import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/core/decorators/is-public';
import { ProjectPlanConfigs } from '../shared/configs/project-plan-configs';
import { UserPlanConfigs } from '../shared/configs/user-plan-configs';
import { getEnvConfig } from '../shared/configs/env-configs';
import { ClusterPlanConfigs } from '../shared/configs/cluster-plan-configs';
import { RedisService } from '../shared/redis/redis.service';
import { randomIntegerBetweenInclusive } from '../shared/utils/random-integer-between';

export class DemoConfigResponnse {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  clusterId: string;
}

@ApiTags('Exposed config')
@Controller()
export class ExposedConfigController {
  constructor(private readonly redisService: RedisService) {}

  @Get('/exposed_config')
  @Public()
  public async getExposedConfig() {
    return {
      projectPlanConfigs: ProjectPlanConfigs,
      clusterPlanConfigs: ClusterPlanConfigs,
      userPlanConfigs: UserPlanConfigs,
    };
  }

  @Get('/flaky_route')
  @Public()
  public async flakyRoute() {
    const isSuccess = Math.random() < 0.5;

    if (isSuccess) {
      return { message: 'OK' };
    }

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

  @Public()
  @Get('/check-domain')
  public async checkDomain(@Query('domain') domain: string) {
    if (domain.includes('allowed')) {
      return {
        message: 'OK',
      };
    }

    throw new ForbiddenException('Domain not allowed');
  }

  @Public()
  @Get('/redis-benchmark')
  public async redisBenchmark() {
    const iterations = 1_000;
    const now = performance.now();

    await Promise.all(
      Array.from({ length: iterations }, (_, i) =>
        this.redisService.set(`test:${i}`, randomIntegerBetweenInclusive(1, 100000).toString(), 5),
      ),
    );

    const timeAfterSet = performance.now();

    await Promise.all(
      Array.from({ length: iterations }, (_, i) => this.redisService.get(`test:${i}`)),
    );

    const timeAfterGet = performance.now();

    return {
      timeToSet: (timeAfterSet - now) / iterations,
      timeToGet: (timeAfterGet - timeAfterSet) / iterations,
    };
  }
}
