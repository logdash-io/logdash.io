import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'blogPosts', timestamps: true })
export class BlogPostEntity {
  _id: string;

  @Prop()
  title: string;

  @Prop()
  body: string;

  createdAt: Date;
  updatedAt: Date;
}

export type BlogPostDocument = HydratedDocument<BlogPostEntity>;

export const BlogPostSchema = SchemaFactory.createForClass(BlogPostEntity);
