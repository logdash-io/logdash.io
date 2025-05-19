import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClusterWriteService } from './cluster-write.service';
import { ClusterEntity, ClusterSchema } from '../core/entities/cluster.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClusterEntity.name, schema: ClusterSchema },
    ]),
  ],
  providers: [ClusterWriteService],
  exports: [ClusterWriteService],
})
export class ClusterWriteModule {}
