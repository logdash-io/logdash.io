import type { ServerLoadEvent } from '@sveltejs/kit';
import { resolve_data_preloader } from '$lib/domains/shared/data-preloader/resolve-data-preloader';
import { BlogPostsDataPreloader } from '$lib/domains/blog/infrastructure/data-preloaders/blog-posts.data-preloader';
import type { BlogPostListItem } from '$lib/domains/blog/domain/blog-post';

export const load = async (
  event: ServerLoadEvent,
): Promise<{
  blogPosts: BlogPostListItem[];
}> => {
  return resolve_data_preloader(BlogPostsDataPreloader)(event);
};
