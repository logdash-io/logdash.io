import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { Feature } from '$lib/domains/shared/types.js';
import { ClustersService } from '$lib/domains/app/clusters/infrastructure/clusters.service.js';
import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';
import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';

export type WizardStep = 1 | 2;

export type WizardService = {
  id: string;
  name: string;
  features: Feature[];
};

export type WizardProject = {
  name: string;
  color: string;
};

export type ScrollTarget = 'project' | `service-${string}`;

type WizardStateType = {
  step: WizardStep;
  project: WizardProject;
  services: WizardService[];
  isSubmitting: boolean;
  isActive: boolean;
};

export const PROJECT_COLORS = [
  '#e7000b',
  '#fe9a00',
  '#155dfc',
  '#00a6a6',
  '#00a600',
  '#505050',
];

const TEMP_CLUSTER_ID = 'temp-wizard';

class WizardState {
  private _state = $state<WizardStateType>({
    step: 1,
    project: {
      name: '',
      color: PROJECT_COLORS[0],
    },
    services: [],
    isSubmitting: false,
    isActive: false,
  });

  private scrollHandler: ((target: ScrollTarget) => void) | null = null;

  get step(): WizardStep {
    return this._state.step;
  }

  get project(): WizardProject {
    return this._state.project;
  }

  get services(): WizardService[] {
    return this._state.services;
  }

  get isSubmitting(): boolean {
    return this._state.isSubmitting;
  }

  get isActive(): boolean {
    return this._state.isActive;
  }

  get canProceedToStep2(): boolean {
    return this._state.project.name.length >= 3;
  }

  get hasValidServices(): boolean {
    return (
      this._state.services.length > 0 &&
      this._state.services.every((s) => s.name.length >= 1)
    );
  }

  get isValid(): boolean {
    return this.canProceedToStep2 && this.hasValidServices;
  }

  get tempClusterId(): string {
    return TEMP_CLUSTER_ID;
  }

  setScrollHandler(handler: (target: ScrollTarget) => void): void {
    this.scrollHandler = handler;
  }

  scrollToSection(target: ScrollTarget): void {
    this.scrollHandler?.(target);
  }

  setProjectName(name: string): void {
    this._state.project.name = name;
    this.syncWithClustersState();
  }

  setProjectColor(color: string): void {
    this._state.project.color = color;
    this.syncWithClustersState();
  }

  addService(name: string = ''): string {
    const id = crypto.randomUUID();
    this._state.services = [
      ...this._state.services,
      { id, name, features: [] },
    ];
    this.syncWithClustersState();
    return id;
  }

  removeService(id: string): void {
    this._state.services = this._state.services.filter((s) => s.id !== id);
    this.syncWithClustersState();
  }

  updateServiceName(id: string, name: string): void {
    const service = this._state.services.find((s) => s.id === id);
    if (service) {
      service.name = name;
      this.syncWithClustersState();
    }
  }

  toggleServiceFeature(serviceId: string, feature: Feature): void {
    const service = this._state.services.find((s) => s.id === serviceId);
    if (!service) return;

    if (service.features.includes(feature)) {
      service.features = service.features.filter((f) => f !== feature);
    } else {
      service.features = [...service.features, feature];
    }
    this.syncWithClustersState();
  }

  nextStep(): void {
    if (this._state.step === 1 && this.canProceedToStep2) {
      this._state.step = 2;
      if (this._state.services.length === 0) {
        this.addService();
      }
    }
  }

  prevStep(): void {
    if (this._state.step === 2) {
      this._state.step = 1;
    }
  }

  goToStep(step: WizardStep): void {
    if (step === 1) {
      this._state.step = 1;
    } else if (step === 2 && this.canProceedToStep2) {
      this._state.step = 2;
    }
  }

  private syncWithClustersState(): void {
    const tempCluster = {
      id: TEMP_CLUSTER_ID,
      name: this._state.project.name || 'New Project',
      members: [],
      creatorId: '',
      tier: 'free',
      projects: this._state.services.map((service) => ({
        id: service.id,
        name: service.name || 'New Service',
        features: service.features,
        selectedFeatures: service.features,
      })),
      publicDashboards: [],
      color: this._state.project.color,
    };

    const existingClusters = clustersState.clusters.filter(
      (c) => c.id !== TEMP_CLUSTER_ID,
    );
    clustersState.set([...existingClusters, tempCluster]);
  }

  async submit(): Promise<void> {
    if (!this.isValid || this._state.isSubmitting) return;

    this._state.isSubmitting = true;

    try {
      const cluster = await ClustersService.createCluster({
        name: this._state.project.name,
        color: this._state.project.color,
      });

      if (this._state.services.length > 0) {
        await ProjectsService.createProjectsBulk(
          cluster.id,
          this._state.services.map((s) => ({
            name: s.name,
            selectedFeatures: s.features,
          })),
        );
      }

      this.removeTempCluster();
      this.reset();

      void goto(resolve(`/app/clusters/${cluster.id}`), {
        invalidateAll: true,
      });
    } finally {
      this._state.isSubmitting = false;
    }
  }

  private removeTempCluster(): void {
    const existingClusters = clustersState.clusters.filter(
      (c) => c.id !== TEMP_CLUSTER_ID,
    );
    clustersState.set(existingClusters);
  }

  reset(): void {
    this._state = {
      step: 1,
      project: {
        name: '',
        color: PROJECT_COLORS[0],
      },
      services: [],
      isSubmitting: false,
      isActive: false,
    };
    this.removeTempCluster();
  }

  initialize(): void {
    this._state.isActive = true;
    this._state.step = 1;
    this._state.project = { name: '', color: PROJECT_COLORS[0] };
    this._state.services = [];
    this._state.isSubmitting = false;
    this.syncWithClustersState();
  }

  deactivate(): void {
    this._state.isActive = false;
    this.removeTempCluster();
  }
}

export const wizardState = new WizardState();
