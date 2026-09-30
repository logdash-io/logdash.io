<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card';
  import { Button } from '@logdash/hyper-ui/presentational';

  type Props = {
    clusterId: string;
  };

  const { clusterId }: Props = $props();

  async function onDeleteCluster(): Promise<void> {
    const confirmed = confirm(
      'Delete this domain from Logdash? All its services and their data will be deleted. This cannot be undone. Your registered domain is not affected.',
    );

    if (!confirmed) return;

    const dismissLoading = toast.info('Deleting domain', 60000);

    try {
      await clustersState.delete(clusterId);
      dismissLoading();
      toast.success('Domain deleted', 5000);
      void goto(resolve('/app/domains'));
    } catch (error) {
      dismissLoading();
      const message = readHttpErrorMessage(error) ?? 'Something went wrong';
      toast.error(`Failed to delete domain: ${message}`, 5000);
    }
  }
</script>

<SettingsCard
  title="Danger zone"
  description="Actions that cannot be undone."
  variant="danger"
>
  <SettingsCardItem>
    <p>Delete domain</p>
    <p class="text-neutral-500">
      Removes this domain and its services from Logdash. Your registered domain
      is not affected.
    </p>

    {#snippet action()}
      <Button
        variant="danger"
        size="sm"
        onclick={onDeleteCluster}
        loading={clustersState.isDeleting}
      >
        Delete
      </Button>
    {/snippet}
  </SettingsCardItem>
</SettingsCard>
