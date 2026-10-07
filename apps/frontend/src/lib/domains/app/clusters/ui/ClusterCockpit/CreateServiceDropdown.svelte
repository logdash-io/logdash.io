<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ProjectsService } from '$lib/domains/app/projects/infrastructure/projects.service.js';
  import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error.js';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { Button, Input } from '@logdash/hyper-ui/presentational';
  import { cubicOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';

  type Props = {
    clusterId: string;
    onClose: () => void;
    inputId?: string;
  };

  const {
    clusterId,
    onClose,
    inputId = 'new-service-name-input',
  }: Props = $props();

  let isCreating = $state(false);
  let serviceName = $state('');

  const canCreate = $derived(serviceName.trim().length > 0 && !isCreating);

  $effect(() => {
    const opener = document.activeElement;
    setTimeout(() => document.getElementById(inputId)?.focus(), 50);

    return () => {
      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  });

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (!canCreate) {
      return;
    }

    isCreating = true;

    try {
      const result = await ProjectsService.createProject(clusterId, {
        name: serviceName.trim(),
      });

      onClose();
      await goto(
        resolve('/app/domains/[cluster_id]/[project_id]', {
          cluster_id: clusterId,
          project_id: result.project.id,
        }),
        { invalidateAll: true },
      );
    } catch (error) {
      if (readHttpErrorStatus(error) === 409) {
        onClose();
        upgradeState.openModal('project-limit');
        return;
      }

      toast.error('Failed to create service');
    } finally {
      isCreating = false;
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }
</script>

<button
  class="fixed inset-0 z-40 cursor-default"
  onclick={onClose}
  aria-label="Close form"
  tabindex="-1"
></button>

<form
  class="bg-surface-elevated-bg edge absolute top-full right-0 z-50 mt-2 flex w-80 flex-col gap-3 rounded-xl p-4 shadow-xl"
  in:scale={{ duration: 150, start: 0.95, easing: cubicOut }}
  onsubmit={onSubmit}
  onkeydown={onKeydown}
>
  <div class="flex flex-col gap-1">
    <h3 class="text-sm font-medium">New service</h3>
    <p class="text-fg-muted text-[13px]">
      A backend, worker or app that sends logs and metrics from its code.
    </p>
  </div>

  <Input
    id={inputId}
    type="text"
    placeholder="api, worker, mobile app"
    size="sm"
    class="w-full"
    bind:value={serviceName}
    maxlength={64}
  />

  <Button
    type="submit"
    variant="primary"
    size="sm"
    disabled={!canCreate}
    loading={isCreating}
  >
    Create service
  </Button>
</form>
