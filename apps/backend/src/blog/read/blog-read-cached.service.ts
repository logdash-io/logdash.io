import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogReadService } from './blog-read.service';
import { RedisService } from '../../shared/redis/redis.service';
import { Logger } from '@logdash/js-sdk';
import { BlogPostNormalized } from '../core/entities/blog-post.interface';

@Injectable()
export class BlogReadCachedService {
  constructor(
    private readonly blogReadService: BlogReadService,
    private readonly logger: Logger,
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
      return JSON.parse(blogPostJson) as BlogPostNormalized;
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

  public async readAllBlogPosts(): Promise<BlogPostNormalized[]> {
    const cacheKey = 'blog-posts:list';
    const cacheTtlSeconds = 30; // 30 seconds

    const blogPostsJson = await this.redisService.get(cacheKey);

    if (blogPostsJson !== null) {
      return JSON.parse(blogPostsJson) as BlogPostNormalized[];
    }

    const blogPosts = await this.blogReadService.readAll();

    await this.redisService.set(cacheKey, JSON.stringify(blogPosts), cacheTtlSeconds);

    return blogPosts;
  }
}
