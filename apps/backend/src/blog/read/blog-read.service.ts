import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogPostDocument, BlogPostEntity } from '../core/entities/blog-post.entity';
import { BlogPostSerializer } from '../core/entities/blog-post.serializer';
import { BlogPostNormalized } from '../core/entities/blog-post.interface';

@Injectable()
export class BlogReadService {
  constructor(
    @InjectModel(BlogPostEntity.name)
    private readonly blogPostModel: Model<BlogPostDocument>,
  ) {}

  public async readAll(): Promise<BlogPostNormalized[]> {
    const entities = await this.blogPostModel.find().sort({ createdAt: -1 }).exec();
    return entities.map((entity) => BlogPostSerializer.normalize(entity));
  }

  public async readById(id: string): Promise<BlogPostNormalized | null> {
    const entity = await this.blogPostModel.findById(id).exec();
    if (!entity) {
      return null;
    }
    return BlogPostSerializer.normalize(entity);
  }
}
