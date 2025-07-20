import { BlogPostNormalized, BlogPostSerialized, BlogPostListItem } from './blog-post.interface';

export class BlogPostSerializer {
  public static normalize(entity: any): BlogPostNormalized {
    return {
      id: entity._id.toString(),
      title: entity.title,
      body: entity.body,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public static serialize(normalized: BlogPostNormalized): BlogPostSerialized {
    return {
      id: normalized.id,
      title: normalized.title,
      body: normalized.body,
      createdAt: normalized.createdAt.toISOString(),
      updatedAt: normalized.updatedAt.toISOString(),
    };
  }

  public static serializeListItem(normalized: BlogPostNormalized): BlogPostListItem {
    return {
      id: normalized.id,
      title: normalized.title,
      createdAt: normalized.createdAt.toISOString(),
    };
  }

  public static serializeMany(normalized: BlogPostNormalized[]): BlogPostSerialized[] {
    return normalized.map((item) => this.serialize(item));
  }

  public static serializeManyListItems(normalized: BlogPostNormalized[]): BlogPostListItem[] {
    return normalized.map((item) => this.serializeListItem(item));
  }
}
