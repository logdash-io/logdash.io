<script lang="ts">
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { MonitorMode } from '$lib/domains/app/projects/domain/monitoring/monitor-mode.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import type { UpdateMonitorDto } from '$lib/domains/app/projects/infrastructure/monitoring.service.js';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import {
    isValidUrl,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url.js';
  import { Button, Input, Label } from '@logdash/hyper-ui/presentational';
  import { fromAction } from 'svelte/attachments';
  import MonitorUrlField from '../../../setup/MonitorUrlField.svelte';

  type Props = {
    isOpen: boolean;
    onClose: () => void;
    monitor: Monitor;
  };

  const { isOpen, onClose, monitor }: Props = $props();

  const MAX_NAME_LENGTH = 255;

  let name = $state('');
  let url = $state('');
  let isSaving = $state(false);

  const isPull = $derived(monitor.mode === MonitorMode.PULL);
  const changes = $derived(readChanges());
  const isValid = $derived(
    name.trim().length > 0 && (!isPull || isValidUrl(url.trim())),
  );

  $effect.pre(() => {
    if (!isOpen) {
      return;
    }

    name = monitor.name;
    url = monitor.url ?? '';
  });

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (!isValid || isSaving) {
      return;
    }

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    isSaving = true;

    try {
      await monitoringState.updateMonitor(monitor.id, changes);
      toast.success('Monitor updated', 5000);
      onClose();
    } catch {
      toast.error('Failed to update the monitor', 5000);
    } finally {
      isSaving = false;
    }
  }

  function readChanges(): UpdateMonitorDto {
    const nextName = name.trim();
    const nextUrl = tryPrependProtocol(url.trim());

    return {
      ...(nextName !== monitor.name && { name: nextName }),
      ...(isPull && nextUrl !== monitor.url && { url: nextUrl }),
    };
  }
</script>

<Modal {isOpen} {onClose}>
  <form class="flex flex-col gap-5" onsubmit={onSubmit}>
    <h3 class="text-lg font-medium">Edit monitor</h3>

    <div class="flex flex-col gap-2">
      <Label class="font-medium" for="edit-monitor-name">Name</Label>
      <Input
        id="edit-monitor-name"
        bind:value={name}
        maxlength={MAX_NAME_LENGTH}
        class="w-full"
        placeholder="My API Service"
        {@attach fromAction(autoFocus, () => ({ delay: 100 }))}
      />
    </div>

    {#if isPull}
      <MonitorUrlField
        id="edit-monitor-url"
        projectId={monitor.projectId}
        bind:value={url}
      />
    {/if}

    <div class="flex justify-end gap-2">
      <Button variant="ghost" onclick={onClose}>Cancel</Button>
      <Button
        type="submit"
        variant="primary"
        disabled={!isValid}
        loading={isSaving}
      >
        Save
      </Button>
    </div>
  </form>
</Modal>
