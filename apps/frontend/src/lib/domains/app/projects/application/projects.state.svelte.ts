import { Feature } from '$lib/domains/shared/types.js';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import type { Project } from '$lib/domains/app/projects/domain/project';
import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';
import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';

// todo: divide api calls responsibility from state
class ProjectsState {
  private _projects = $state<Record<Project['id'], Project>>({});
  private _apiKeys = $state<Record<Project['id'], string>>({});
  private _loadingApiKey = $state<Record<Project['id'], boolean>>({});
  private _deletingProject = $state<Record<Project['id'], boolean>>({});
  private _updatingProject = $state<Record<Project['id'], boolean>>({});
  private _initialized = $state(false);

  isLoadingApiKey(projectId: string): boolean {
    return this._loadingApiKey[projectId] || false;
  }

  isUpdatingProject(projectId: string): boolean {
    return this._updatingProject[projectId] || false;
  }

  isDeletingProject(projectId: string): boolean {
    return this._deletingProject[projectId] || false;
  }

  get projects(): Project[] {
    return Object.values(this._projects).sort((a, b) => {
      return a.id > b.id ? 1 : -1;
    });
  }

  get ready(): boolean {
    return this._initialized;
  }

  projectName(id: string): string {
    return this._projects[id]?.name || '';
  }

  set(projects: Project[]): void {
    this._projects = arrayToObject(projects, 'id');
    this._initialized = true;
  }

  hasConfiguredFeature(projectId: string, feature: Feature): boolean {
    return this._projects[projectId]?.features?.includes(feature) ?? false;
  }

  async getApiKey(projectId: string): Promise<string> {
    if (this._apiKeys[projectId]) {
      return this._apiKeys[projectId];
    }

    this._loadingApiKey[projectId] = true;

    try {
      const apiKey = await ProjectsService.getApiKey(projectId);
      this._apiKeys[projectId] = apiKey;
      return apiKey;
    } finally {
      delete this._loadingApiKey[projectId];
    }
  }

  async createProject(clusterId: string, name: string): Promise<Project['id']> {
    const response = await fetch(`/app/api/projects?cluster_id=${clusterId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    const project = (await response.json()) as Project;

    this._projects[project.id] = { ...project, features: [] };
    return project.id;
  }

  async updateProject(projectId: string, name: string): Promise<void> {
    if (this._updatingProject[projectId]) {
      return;
    }
    this._updatingProject[projectId] = true;

    try {
      await ProjectsService.updateProject(projectId, { name });

      const project = this._projects[projectId];
      if (project) {
        project.name = name;
      }
      clustersState.renameProject(projectId, name);
    } finally {
      delete this._updatingProject[projectId];
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    if (this._deletingProject[projectId]) {
      return;
    }
    this._deletingProject[projectId] = true;

    try {
      await ProjectsService.deleteProject(projectId);
      delete this._projects[projectId];
      delete this._apiKeys[projectId];
      delete this._loadingApiKey[projectId];
    } finally {
      delete this._deletingProject[projectId];
    }
  }
}

export const projectsState = new ProjectsState();
