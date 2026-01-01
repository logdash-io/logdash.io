import { HttpException, Injectable } from '@nestjs/common';
import { RedisService, TtlOverwriteStrategy } from '../../shared/redis/redis.service';
import { getEnvConfig } from '../../shared/configs/env-configs';

const adjectives = ['happy', 'angry', 'excited', 'curious', 'capable'];
const animals = ['capybara', 'dolphin', 'elephant', 'giraffe', 'kangaroo'];

@Injectable()
export class AddTestLogRateLimitService {
  constructor(private readonly redisService: RedisService) {}

  public async checkAndIncrement(projectId: string, ip: string): Promise<void> {
    const count = await this.increment(projectId, ip);

    if (count > getEnvConfig().demo.addTestLogRateLimit.limit) {
      throw new HttpException('Rate limit exceeded', 429);
    }
  }

  private async increment(projectId: string, ip: string): Promise<number> {
    const key = `add-test-log:${projectId}:${ip}`;

    return await this.redisService.increment(key, {
      ttlOverwriteStrategy: TtlOverwriteStrategy.SetOnlyIfNoExpiry,
      ttlSeconds: getEnvConfig().demo.addTestLogRateLimit.timeWindowSeconds,
    });
  }

  public async getAnimal(ip: string): Promise<string> {
    const key = `add-test-log:animal:${ip}`;

    const animal = await this.redisService.get(key);

    if (!animal) {
      const randomName = this.getRandomName();

      await this.redisService.set(key, randomName, 3600);

      return randomName;
    }

    return animal;
  }

  private getRandomName(): string {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];

    return `${adjective} ${animal}`;
  }
}
