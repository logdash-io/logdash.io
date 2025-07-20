import { httpClient } from '$lib/domains/shared/http/http-client.js';
import type { BlogPost, BlogPostListItem } from '../domain/blog-post.js';

export class BlogService {
  static async getBlogPosts(): Promise<BlogPostListItem[]> {
    return httpClient.get<BlogPostListItem[]>('/blog_posts', {
      requireAuth: false,
    });
  }

  static async getBlogPost(blogPostId: string): Promise<BlogPost> {
    return httpClient.get<BlogPost>(`/blog_posts/${blogPostId}`, {
      requireAuth: false,
    });
  }
}
