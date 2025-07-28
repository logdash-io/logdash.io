import type { DataPreloader } from '$lib/domains/shared/data-preloader/data-preloader';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { BlogPostListItem } from '../../domain/blog-post';
import { BlogService } from '../blog.service';

export class BlogPostsDataPreloader
  implements DataPreloader<{ blogPosts: BlogPostListItem[] }>
{
  async preload(_event: ServerLoadEvent): Promise<{
    blogPosts: BlogPostListItem[];
  }> {
    try {
      const blogPosts = await BlogService.getBlogPosts();
      return { blogPosts };
    } catch (error) {
      console.error('Failed to load blog posts', error.message);
      return { blogPosts: [] };
    }
  }
}
