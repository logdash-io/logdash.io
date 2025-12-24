import { Feature } from '$lib/domains/shared/types.js';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import type { Project } from '$lib/domains/app/projects/domain/project';
import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';
import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';

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

  hasFeature(projectId: string, feature: Feature): boolean {
    const project = this._projects[projectId];
    if (!project) {
      return false;
    }

    return (
      project.selectedFeatures?.includes(feature) ||
      project.features.includes(feature)
    );
  }

  hasConfiguredFeature(projectId: string, feature: Feature): boolean {
    return this._projects[projectId]?.features?.includes(feature) ?? false;
  }

  getApiKey(projectId: string): Promise<string> {
    if (this._apiKeys[projectId]) {
      return Promise.resolve(this._apiKeys[projectId]);
    }

    this._loadingApiKey[projectId] = true;
    return fetch(`/app/api/projects/${projectId}/api-key`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then(({ data }) => {
        delete this._loadingApiKey[projectId];
        this._apiKeys[projectId] = data;
        return data;
      });
  }

  createProject(clusterId: string, name: string): Promise<Project['id']> {
    return fetch(`/app/api/projects?cluster_id=${clusterId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })
      .then((response) => response.json())
      .then((project) => {
        this._projects[project.id] = { ...project, features: [] };
        return project.id;
      });
  }

  updateProject(projectId: string, name: string): Promise<void> {
    if (this._updatingProject[projectId]) {
      return Promise.resolve();
    }
    this._updatingProject[projectId] = true;

    return fetch(`/app/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    }).then(() => {
      this._projects[projectId].name = name;
      delete this._updatingProject[projectId];
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    if (this._deletingProject[projectId]) {
      return;
    }
    this._deletingProject[projectId] = true;

    await fetch(`/app/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    delete this._projects[projectId];
    delete this._apiKeys[projectId];
    delete this._loadingApiKey[projectId];
    delete this._deletingProject[projectId];
  }

  async addFeature(projectId: string, feature: Feature): Promise<void> {
    const project = this._projects[projectId];
    if (!project) {
      return;
    }

    if (project.selectedFeatures?.includes(feature)) {
      return;
    }

    const previousFeatures = project.selectedFeatures || [];
    const updatedFeatures = [...previousFeatures, feature];

    this._projects[projectId] = {
      ...project,
      selectedFeatures: updatedFeatures,
    };

    try {
      await ProjectsService.updateProject(projectId, {
        selectedFeatures: updatedFeatures,
      });
    } catch (error) {
      this._projects[projectId] = {
        ...project,
        selectedFeatures: previousFeatures,
      };

      toast.error('Failed to add feature to project');
      throw error;
    }
  }
}

export const projectsState = new ProjectsState();
