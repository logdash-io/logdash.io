import { ApiProperty } from '@nestjs/swagger';

export class BlogPostNormalized {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BlogPostSerialized {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class BlogPostListItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: string;
}
