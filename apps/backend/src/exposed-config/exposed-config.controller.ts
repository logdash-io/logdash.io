import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Param,
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

export class RedisBenchmarkResponse {
  @ApiProperty()
  setMetrics: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };

  @ApiProperty()
  getMetrics: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

@ApiTags('Exposed config')
@Controller()
export class ExposedConfigController {
  constructor(private readonly redisService: RedisService) {}

  private calculatePercentiles(values: number[]): {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  } {
    const sorted = values.slice().sort((a, b) => a - b);
    const length = sorted.length;

    const getPercentile = (percentile: number): number => {
      const index = Math.ceil((percentile / 100) * length) - 1;
      return sorted[Math.max(0, Math.min(index, length - 1))];
    };

    return {
      p50: getPercentile(50),
      p90: getPercentile(90),
      p95: getPercentile(95),
      p99: getPercentile(99),
    };
  }

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
  @Get('/redis-benchmark/:iterations')
  @ApiResponse({ type: RedisBenchmarkResponse })
  public async redisBenchmark(
    @Param('iterations') iterations: number,
  ): Promise<RedisBenchmarkResponse> {
    const setTimes: number[] = [];
    const getTimes: number[] = [];

    const keys = Array.from({ length: iterations }, (_, i) => `test:${i}`);
    const values = keys.map(() => randomIntegerBetweenInclusive(1, 100000).toString());

    for (let i = 0; i < iterations; i++) {
      const setStart = Date.now();
      await this.redisService.set(keys[i], values[i], 5);
      const setEnd = Date.now();
      setTimes.push(setEnd - setStart);
    }

    for (let i = 0; i < iterations; i++) {
      const getStart = Date.now();
      await this.redisService.get(keys[i]);
      const getEnd = Date.now();
      getTimes.push(getEnd - getStart);
    }

    return {
      setMetrics: this.calculatePercentiles(setTimes),
      getMetrics: this.calculatePercentiles(getTimes),
    };
  }
}
