import { Module } from '@nestjs/common';
import { MetricRegisterCoreController } from './metric-register-core.controller';
import { MetricRegisterWriteModule } from '../write/metric-register-write.module';
import { MetricWriteModule } from '../../metric/write/metric-write.module';
import { ClusterMemberGuardImports } from '../../cluster/guards/cluster-member/cluster-member.guard';
import { MetricRegisterRedisModule } from '../redis/metric-register-redis.module';

@Module({
  imports: [
    MetricRegisterWriteModule,
    MetricWriteModule,
    MetricRegisterRedisModule,
    ...ClusterMemberGuardImports,
  ],
  controllers: [MetricRegisterCoreController],
})
export class MetricRegisterCoreModule {}
