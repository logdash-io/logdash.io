import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClusterWriteService } from './cluster-write.service';
import { ClusterEntity, ClusterSchema } from '../core/entities/cluster.entity';
import { ClusterReadModule } from '../read/cluster-read.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ClusterEntity.name, schema: ClusterSchema }]),
    ClusterReadModule,
  ],
  providers: [ClusterWriteService],
  exports: [ClusterWriteService],
})
export class ClusterWriteModule {}
