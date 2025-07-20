import type { ServerLoadEvent } from '@sveltejs/kit';
import { resolve_data_preloader } from '$lib/domains/shared/data-preloader/resolve-data-preloader';
import { BlogPostDataPreloader } from '$lib/domains/blog/infrastructure/data-preloaders/blog-post.data-preloader';
import type { BlogPost } from '$lib/domains/blog/domain/blog-post';

export const load = async (
  event: ServerLoadEvent,
): Promise<{
  blogPost: BlogPost;
}> => {
  return resolve_data_preloader(BlogPostDataPreloader)(event);
};
