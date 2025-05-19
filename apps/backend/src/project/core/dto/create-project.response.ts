import { ApiProperty } from '@nestjs/swagger';
import { ProjectSerialized } from '../entities/project.interface';

export class CreateProjectResponse {
  @ApiProperty({ type: ProjectSerialized })
  project: ProjectSerialized;

  @ApiProperty()
  apiKey: string;
}
