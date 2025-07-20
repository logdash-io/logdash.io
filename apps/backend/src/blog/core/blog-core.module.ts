import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogPostEntity, BlogPostSchema } from './entities/blog-post.entity';
import { BlogCoreController } from './blog-core.controller';
import { BlogReadModule } from '../read/blog-read.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BlogPostEntity.name, schema: BlogPostSchema }]),
    BlogReadModule,
  ],
  controllers: [BlogCoreController],
  providers: [],
  exports: [],
})
export class BlogCoreModule {}
