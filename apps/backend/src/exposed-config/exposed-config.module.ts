import { Module } from '@nestjs/common';
import { ExposedConfigController } from './exposed-config.controller';

@Module({
  controllers: [ExposedConfigController],
})
export class ExposedConfigModule {}
