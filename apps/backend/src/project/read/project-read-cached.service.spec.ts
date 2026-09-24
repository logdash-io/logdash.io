import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RedisService } from '../../shared/redis/redis.service';
import { PROJECTS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { ProjectReadCachedService } from './project-read-cached.service';
import { ProjectReadService } from './project-read.service';

describe('ProjectReadCachedService', () => {
  let service: ProjectReadCachedService;

  beforeEach(async () => {
    const cache = new Map<string, string>();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectReadCachedService,
        { provide: ProjectReadService, useValue: { readById: () => Promise.resolve(null) } },
        {
          provide: RedisService,
          useValue: {
            get: (key: string) => Promise.resolve(cache.get(key) ?? null),
            set: (key: string, value: string) => Promise.resolve(void cache.set(key, value)),
          },
        },
        { provide: PROJECTS_LOGGER, useValue: { error: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(ProjectReadCachedService);
  });

  it('reads a missing project as not found while the miss is cached', async () => {
    // when
    const first = await service.readProject('missing');
    const second = await service.readProject('missing');

    // then
    expect(first).toBeNull();
    expect(second).toBeNull();
    await expect(service.readProjectOrThrow('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
