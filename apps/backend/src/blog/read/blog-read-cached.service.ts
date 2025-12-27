import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BlogReadService } from './blog-read.service';
import { RedisService } from '../../shared/redis/redis.service';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { BLOG_LOGGER } from '../../shared/logdash/logdash-tokens';
import { BlogPostNormalized } from '../core/entities/blog-post.interface';

interface RedisSerializedBlogPost {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class BlogReadCachedService {
  constructor(
    private readonly blogReadService: BlogReadService,
    @Inject(BLOG_LOGGER) private readonly logger: LogdashLogger,
    private readonly redisService: RedisService,
  ) {}

  public async readBlogPost(blogPostId: string): Promise<BlogPostNormalized | null> {
    const cacheKey = `blog-post:${blogPostId}`;
    const cacheTtlSeconds = 30; // 30 seconds

    const blogPostJson = await this.redisService.get(cacheKey);

    if (blogPostJson === 'null') {
      throw Error('Blog post not found. You have to wait 5 minutes before trying again');
    }

    if (blogPostJson !== null) {
      const serialized = JSON.parse(blogPostJson) as RedisSerializedBlogPost;
      return {
        id: serialized.id,
        title: serialized.title,
        body: serialized.body,
        createdAt: new Date(serialized.createdAt),
        updatedAt: new Date(serialized.updatedAt),
      };
    }

    const blogPost = await this.blogReadService.readById(blogPostId);

    if (!blogPost) {
      await this.redisService.set(cacheKey, 'null', cacheTtlSeconds);
      this.logger.error(`Blog post not found`, {
        blogPostId,
      });
      return null;
    }

    await this.redisService.set(cacheKey, JSON.stringify(blogPost), cacheTtlSeconds);

    return blogPost;
  }

  public async readBlogPostOrThrow(blogPostId: string): Promise<BlogPostNormalized> {
    const blogPost = await this.readBlogPost(blogPostId);
    if (!blogPost) {
      throw new NotFoundException('Blog post not found');
    }
    return blogPost;
  }

  public async readAll(): Promise<BlogPostNormalized[]> {
    const cacheKey = 'blog-posts:list';
    const cacheTtlSeconds = 30; // 30 seconds

    const blogPostsJson = await this.redisService.get(cacheKey);

    if (blogPostsJson !== null) {
      const serialized = JSON.parse(blogPostsJson) as RedisSerializedBlogPost[];

      return serialized.map((post) => ({
        id: post.id,
        title: post.title,
        body: post.body,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
      }));
    }

    const blogPosts = await this.blogReadService.readAll();

    await this.redisService.set(cacheKey, JSON.stringify(blogPosts), cacheTtlSeconds);

    return blogPosts;
  }
}
