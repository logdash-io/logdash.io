import { httpClient } from '$lib/domains/shared/http/http-client.js';
import type { Project } from '$lib/domains/app/projects/domain/project.js';
import type { Feature } from '$lib/domains/shared/types.js';

export interface CreateProjectDto {
  name: string;
  selectedFeatures?: Feature[];
}

export interface CreateProjectResponse {
  project: Project;
  apiKey: string;
}

export class ProjectsService {
  static async createProject(
    clusterId: string,
    dto: CreateProjectDto,
  ): Promise<CreateProjectResponse> {
    return httpClient.post<CreateProjectResponse>(
      `/clusters/${clusterId}/projects`,
      dto,
    );
  }

  static async createProjectsBulk(
    clusterId: string,
    projects: CreateProjectDto[],
  ): Promise<CreateProjectResponse[]> {
    const results = await Promise.all(
      projects.map((project) => this.createProject(clusterId, project)),
    );
    return results;
  }
}
