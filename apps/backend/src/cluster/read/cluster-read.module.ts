import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClusterReadService } from './cluster-read.service';
import { ClusterEntity, ClusterSchema } from '../core/entities/cluster.entity';
import { ClusterReadCachedService } from './cluster-read-cached.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ClusterEntity.name, schema: ClusterSchema }])],
  providers: [ClusterReadService, ClusterReadCachedService],
  exports: [ClusterReadService, ClusterReadCachedService],
})
export class ClusterReadModule {}
