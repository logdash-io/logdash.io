<script lang="ts">
  import { resolve } from '$app/paths';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { ClustersService } from '$lib/domains/app/clusters/infrastructure/clusters.service.js';
  import { projectsState } from '$lib/domains/app/projects/application/projects.state.svelte.js';
  import type { Project } from '$lib/domains/app/projects/domain/project.js';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import KeyIcon from '$lib/domains/shared/icons/KeyIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import { Feature } from '$lib/domains/shared/types.js';
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte.js';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import {
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card/index.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { Button } from '@logdash/hyper-ui/presentational';

  type Props = {
    clusterId: string;
    canEdit: boolean;
  };

  const { clusterId, canEdit }: Props = $props();

  let copying = $state(false);

  async function onCopyKey(): Promise<void> {
    copying = true;

    try {
      await navigator.clipboard.writeText(
        await ClustersService.getIngestKey(clusterId),
      );
      toast.success('Ingest key copied to clipboard', 5000);
    } catch (error) {
      const message = readHttpErrorMessage(error) ?? 'Something went wrong';
      toast.error(`Failed to copy the ingest key: ${message}`, 5000);
    } finally {
      copying = false;
    }
  }

  async function onDeleteApp(app: Project): Promise<void> {
    const confirmed = await confirmDialog.ask({
      title: 'Delete app',
      description: `${app.name} and its logs and metrics will be deleted. It comes back empty if it sends again. This cannot be undone.`,
      confirmLabel: 'Delete app',
    });

    if (!confirmed) {
      return;
    }

    try {
      await projectsState.deleteProject(app.id);
      await clustersState.load();
      toast.success(`Deleted ${app.name}`, 5000);
    } catch (error) {
      const message = readHttpErrorMessage(error) ?? 'Something went wrong';
      toast.error(`Failed to delete ${app.name}: ${message}`, 5000);
    }
  }

  function describe(app: Project): string {
    const logs = app.features?.includes(Feature.LOGGING);
    const metrics = app.features?.includes(Feature.METRICS);

    if (logs && metrics) {
      return 'Logs and metrics';
    }

    if (logs) {
      return 'Logs';
    }

    return metrics ? 'Metrics' : 'Nothing sent yet';
  }
</script>

<SettingsCard
  title="Ingest key"
  description="One write-only key for every app on this domain. Each app names itself with the SDK's app option."
  icon={KeyIcon}
>
  <SettingsCardItem>
    <div class="flex min-w-0 items-center gap-3">
      <span class="text-fg-muted w-16 shrink-0">Key</span>
      <span class="text-fg-muted truncate font-mono" aria-hidden="true">
        ••••••••••••••••
      </span>
    </div>

    {#snippet action()}
      <Button size="sm" onclick={onCopyKey} loading={copying}>
        <CopyIcon class="size-4" />
        Copy
      </Button>
    {/snippet}
  </SettingsCardItem>
</SettingsCard>

<SettingsCard
  title="Apps"
  description="An app shows up after its first log or metric. Deleting one removes its logs and metrics."
  icon={CubeIcon}
>
  {#each projectsState.projects as app (app.id)}
    <SettingsCardItem>
      <div class="flex min-w-0 flex-col">
        <a
          href={resolve(
            `/app/domains/${clusterId}/logs?app=${encodeURIComponent(app.name)}`,
          )}
          class="hover:text-fg-default transition-ink focus-visible:outline-brand truncate rounded-md focus-visible:outline-2"
        >
          {app.name}
        </a>
        <span class="text-fg-muted truncate">{describe(app)}</span>
      </div>

      {#snippet action()}
        {#if canEdit}
          <IconButton
            label="Delete {app.name}"
            tooltip="Delete app"
            danger
            well
            class="-mr-1.5"
            onclick={() => onDeleteApp(app)}
          >
            <TrashIcon class="size-4" />
          </IconButton>
        {/if}
      {/snippet}
    </SettingsCardItem>
  {:else}
    <SettingsCardItem>
      <span class="text-fg-muted">
        No apps yet. Copy the ingest key into your app's Logdash SDK.
      </span>
    </SettingsCardItem>
  {/each}
</SettingsCard>
