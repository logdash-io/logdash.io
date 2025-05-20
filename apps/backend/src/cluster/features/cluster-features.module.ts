import { Module } from '@nestjs/common';
import { ClusterFeaturesService } from './cluster-features.service';

@Module({
  imports: [],
  providers: [ClusterFeaturesService],
  exports: [ClusterFeaturesService],
})
export class ClusterFeaturesModule {}
