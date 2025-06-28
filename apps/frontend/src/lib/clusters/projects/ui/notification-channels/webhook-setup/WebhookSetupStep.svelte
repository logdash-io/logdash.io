<script lang="ts">
  import { autoFocus } from '$lib/shared/ui/actions/use-autofocus.svelte.js';
  import { LinkIcon } from 'lucide-svelte';

  type Props = {
    clusterName: string;
    monitorName: string;
    onCancel?: () => void;
    onSubmit: (dto: {
      withAssignment: boolean;
      url: string;
      name: string;
    }) => void;
  };

  let { monitorName, clusterName, onCancel, onSubmit }: Props = $props();
  let assignToServiceMonitor = $state(false);
  let webhookName = $state('');
  let webhookUrl = $state('');
</script>

<div class="space-y-8 text-center">
  <div class="flex items-center justify-start gap-4">
    <div
      class="success-card flex h-14 w-14 items-center justify-center rounded-full"
    >
      <LinkIcon class="h-6 w-6" />
    </div>

    <div class="flex flex-col items-start">
      <h3 class="text-xl font-semibold">Configure webhook channel</h3>
      <p class="text-secondary/70 text-sm">
        Add it with a memorable name to your project.
      </p>
    </div>
  </div>

  <div class="space-y-2">
    <input
      bind:value={webhookName}
      class="input-sm input-ghost selection:bg-secondary/20 border-secondary/20 focus:border-primary h-full w-full rounded-lg border px-3 py-2 text-lg outline-0 focus:bg-transparent"
      placeholder={'Memorable webhook name'}
      type="text"
      use:autoFocus={{ selectAll: true }}
    />

    <input
      bind:value={webhookUrl}
      class="input-sm input-ghost selection:bg-secondary/20 border-secondary/20 focus:border-primary h-full w-full rounded-lg border px-3 py-2 text-lg outline-0 focus:bg-transparent"
      placeholder={'Webhook URL'}
      type="text"
    />
  </div>

  <div class="flex select-none items-center justify-start gap-2">
    <input
      type="checkbox"
      id="assign-service-monitor"
      bind:checked={assignToServiceMonitor}
      class="checkbox checkbox-primary"
    />
    <label for="assign-service-monitor" class="cursor-pointer text-sm">
      Assign to {monitorName} service monitor
    </label>
  </div>

  <div class="flex gap-3">
    <button
      type="button"
      class="btn btn-secondary btn-soft flex-1"
      onclick={onCancel}
    >
      Back
    </button>
    <button
      type="button"
      class="btn btn-primary flex-1"
      onclick={() =>
        onSubmit({
          withAssignment: assignToServiceMonitor,
          url: webhookUrl,
          name: webhookName,
        })}
    >
      Save channel to {clusterName} project
    </button>
  </div>
</div>
