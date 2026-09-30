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

export interface UpdateProjectDto {
  name?: string;
  selectedFeatures?: Feature[];
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
    const results = await Promise.allSettled(
      projects.map((project) => this.createProject(clusterId, project)),
    );
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    if (failure) {
      throw failure.reason;
    }

    return results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
  }

  static async updateProject(
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<void> {
    return httpClient.put<void>(`/projects/${projectId}`, dto);
  }

  static async getApiKey(projectId: string): Promise<string> {
    const [apiKey] = await httpClient.get<{ value: string }[]>(
      `/projects/${projectId}/api_keys`,
    );

    if (!apiKey) {
      throw new Error('This service has no API key');
    }

    return apiKey.value;
  }

  static async deleteProject(projectId: string): Promise<void> {
    return httpClient.delete<void>(`/projects/${projectId}`);
  }
}
