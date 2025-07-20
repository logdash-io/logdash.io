import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogPostEntity, BlogPostSchema } from '../core/entities/blog-post.entity';
import { BlogReadService } from './blog-read.service';
import { BlogReadCachedService } from './blog-read-cached.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: BlogPostEntity.name, schema: BlogPostSchema }])],
  providers: [BlogReadService, BlogReadCachedService],
  exports: [BlogReadService, BlogReadCachedService],
})
export class BlogReadModule {}
