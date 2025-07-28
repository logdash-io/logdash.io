import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { BlogPost } from '../../domain/blog-post';
import { BlogService } from '../blog.service';

export class BlogPostDataPreloader
  implements DataPreloader<{ blogPost: BlogPost }>
{
  async preload({ params }: ServerLoadEvent): Promise<{ blogPost: BlogPost }> {
    const blogPostId = params.blog_post_id;
    if (!blogPostId) {
      throw new Error('Blog post ID is required');
    }

    const blogPost = await BlogService.getBlogPost(blogPostId);
    return { blogPost };
  }
}
