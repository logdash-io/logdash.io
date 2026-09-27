import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';

export class BlogUtils {
  constructor(private app: INestApplication<App>) {}
}
