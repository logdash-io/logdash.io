import { httpClient } from '$lib/domains/shared/http/http-client.js';

export class ProjectsService {
  static async deleteProject(projectId: string): Promise<void> {
    return httpClient.delete<void>(`/projects/${projectId}`);
  }
}
