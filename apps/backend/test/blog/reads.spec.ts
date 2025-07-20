import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import {
  BlogPostSerialized,
  BlogPostListItem,
} from '../../src/blog/core/entities/blog-post.interface';

describe('BlogCoreController (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  describe('GET /blog_posts', () => {
    it('reads all blog posts with titles and createdAt', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      await bootstrap.models.blogPostModel.create({
        title: 'First Blog Post',
        body: 'This is the content of the first blog post.',
      });

      await bootstrap.models.blogPostModel.create({
        title: 'Second Blog Post',
        body: 'This is the content of the second blog post.',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer()).get('/blog_posts');

      // then
      const blogPosts: BlogPostListItem[] = response.body;
      expect(blogPosts).toHaveLength(2);

      expect(blogPosts[0].title).toBe('Second Blog Post');
      expect(blogPosts[0].createdAt).toBeDefined();
      expect(blogPosts[0]).not.toHaveProperty('body');

      expect(blogPosts[1].title).toBe('First Blog Post');
      expect(blogPosts[1].createdAt).toBeDefined();
      expect(blogPosts[1]).not.toHaveProperty('body');
    });

    it('returns empty array when no blog posts exist', async () => {
      // when
      const response = await request(bootstrap.app.getHttpServer()).get('/blog_posts');

      // then
      const blogPosts: BlogPostListItem[] = response.body;
      expect(blogPosts).toHaveLength(0);
    });
  });

  describe('GET /blog_posts/:blogPostId', () => {
    it('reads specific blog post with all details', async () => {
      // given
      const setup = await bootstrap.utils.generalUtils.setupAnonymous();

      const blogPost = await bootstrap.models.blogPostModel.create({
        title: 'Test Blog Post',
        body: 'This is the complete content of the blog post.',
      });

      // when
      const response = await request(bootstrap.app.getHttpServer()).get(
        `/blog_posts/${blogPost._id}`,
      );

      // then
      const result: BlogPostSerialized = response.body;
      expect(result.id).toBe(blogPost._id.toString());
      expect(result.title).toBe('Test Blog Post');
      expect(result.body).toBe('This is the complete content of the blog post.');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('returns 404 when blog post does not exist', async () => {
      // given
      const nonExistentId = '507f1f77bcf86cd799439011';

      // when
      const response = await request(bootstrap.app.getHttpServer()).get(
        `/blog_posts/${nonExistentId}`,
      );

      // then
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Blog post not found');
    });
  });
});
