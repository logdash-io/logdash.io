import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlogReadService } from '../read/blog-read.service';
import { BlogPostSerialized, BlogPostListItem } from './entities/blog-post.interface';
import { BlogPostSerializer } from './entities/blog-post.serializer';
import { Public } from '../../auth/core/decorators/is-public';

@ApiTags('Blog')
@Controller()
export class BlogCoreController {
  constructor(private readonly blogReadService: BlogReadService) {}

  @Public()
  @Get('/blog_posts')
  @ApiResponse({ type: BlogPostListItem, isArray: true })
  public async readAll(): Promise<BlogPostListItem[]> {
    const blogPosts = await this.blogReadService.readAll();
    return BlogPostSerializer.serializeManyListItems(blogPosts);
  }

  @Public()
  @Get('/blog_posts/:blogPostId')
  @ApiResponse({ type: BlogPostSerialized })
  public async readById(@Param('blogPostId') blogPostId: string): Promise<BlogPostSerialized> {
    const blogPost = await this.blogReadService.readById(blogPostId);

    if (!blogPost) {
      throw new NotFoundException('Blog post not found');
    }

    return BlogPostSerializer.serialize(blogPost);
  }
}
