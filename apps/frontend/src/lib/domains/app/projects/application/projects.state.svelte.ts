import { Feature } from '$lib/domains/shared/types.js';
import { arrayToObject } from '$lib/domains/shared/utils/array-to-object';
import type { Project } from '$lib/domains/app/projects/domain/project';
import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';

class ProjectsState {
  private _projects = $state<Record<Project['id'], Project>>({});
  private _deletingProject = $state<Record<Project['id'], boolean>>({});
  private _initialized = $state(false);

  isDeletingProject(projectId: string): boolean {
    return this._deletingProject[projectId] || false;
  }

  get projects(): Project[] {
    return Object.values(this._projects).sort((a, b) => {
      return a.id > b.id ? 1 : -1;
    });
  }

  get appNames(): string[] {
    return [...new Set(this.projects.map(({ name }) => name))].sort((a, b) =>
      a.localeCompare(b),
    );
  }

  get ready(): boolean {
    return this._initialized;
  }

  set(projects: Project[]): void {
    this._projects = arrayToObject(projects, 'id');
    this._initialized = true;
  }

  hasConfiguredFeature(feature: Feature): boolean {
    return this.projects.some(({ features }) => features?.includes(feature));
  }

  async deleteProject(projectId: string): Promise<void> {
    if (this._deletingProject[projectId]) {
      return;
    }
    this._deletingProject[projectId] = true;

    try {
      await ProjectsService.deleteProject(projectId);
      delete this._projects[projectId];
    } finally {
      delete this._deletingProject[projectId];
    }
  }
}

export const projectsState = new ProjectsState();
