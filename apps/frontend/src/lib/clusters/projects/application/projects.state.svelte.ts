import type { Feature } from '$lib/shared/types.js';
import { arrayToObject } from '$lib/shared/utils/array-to-object';
import type { Project } from '../domain/project';

// todo: divide api calls responsibility from state
class ProjectsState {
	private _projects = $state<Record<Project['id'], Project>>({});
	private _initialized = $state(false);

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

	hasFeature(
		projectId: string,
		feature: Feature.LOGGING | Feature.METRICS,
	): boolean {
		return this._projects[projectId]?.features.includes(feature);
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
}

export const projectsState = new ProjectsState();
