<script lang="ts">
  import { clickShortcut } from '$lib/shared/ui/actions/click-shortcut.svelte.js';
  import { autoFocus } from '$lib/shared/ui/actions/use-autofocus.svelte.js';
  import Tooltip from '$lib/shared/ui/components/Tooltip.svelte';
  import { CheckIcon, PlusIcon, XIcon } from 'lucide-svelte';
  import UpgradeButton from '$lib/shared/upgrade/UpgradeButton.svelte';

  type Props = {
    canAddMore: boolean;
    onSubmit: (name: string) => void;
  };
  const { canAddMore, onSubmit }: Props = $props();

  const MIN_NAME_LENGTH = 1;
  const MAX_NAME_LENGTH = 30;

  let projectName = $state('');
</script>

{#snippet configurator(close: () => void)}
  <div
    class={[
      'ld-card-base ring-base-100 flex h-20 w-96 items-center justify-between gap-2 rounded-xl pr-6 shadow-xl ring transition-colors',
      {
        'focus-within:ring-success/50':
          projectName.length >= MIN_NAME_LENGTH &&
          projectName.length < MAX_NAME_LENGTH,
        'focus-within:ring-primary/50': projectName.length < MIN_NAME_LENGTH,
      },
    ]}
  >
    {#if canAddMore}
      <input
        bind:value={projectName}
        minlength={MIN_NAME_LENGTH}
        maxlength={MAX_NAME_LENGTH}
        class="input-sm input-ghost selection:bg-secondary/20 h-full w-full rounded-lg pl-6 text-lg font-semibold outline-0 focus:bg-transparent"
        placeholder="New service name"
        use:autoFocus={{
          selectAll: true,
        }}
      />

      {#if projectName.length > MIN_NAME_LENGTH && projectName.length < MAX_NAME_LENGTH}{:else}{/if}

      <button
        disabled={projectName.length < MIN_NAME_LENGTH ||
          projectName.length > MAX_NAME_LENGTH}
        class="btn btn-success btn-soft btn-sm btn-square"
        onclick={() => {
          onSubmit(projectName);
          close();
        }}
        use:clickShortcut={{ key: 'Enter' }}
      >
        <CheckIcon class="h-4 w-4" />
      </button>

      <button
        class="btn btn-error btn-soft btn-sm btn-square"
        onclick={close}
        use:clickShortcut={{ key: 'Escape' }}
      >
        <XIcon class="h-4 w-4" />
      </button>
    {:else}
      <div class="flex w-full items-center justify-between gap-2 pl-8">
        <UpgradeButton source="project-limit">
          Upgrade to add more services
        </UpgradeButton>

        <button
          class="btn btn-error btn-soft btn-sm btn-square"
          onclick={close}
        >
          <XIcon class="h-4 w-4" />
        </button>
      </div>
    {/if}
  </div>
{/snippet}

<div class="relative z-10 flex">
  <Tooltip
    class="w-full"
    content={configurator}
    placement="bottom"
    trigger="click"
  >
    <button
      class={'ld-card-base flex cursor-pointer items-center gap-1 rounded-full px-4 py-2'}
      tabindex="0"
    >
      new service
      <PlusIcon class="h-3.5 w-3.5" />
    </button>
  </Tooltip>
</div>
