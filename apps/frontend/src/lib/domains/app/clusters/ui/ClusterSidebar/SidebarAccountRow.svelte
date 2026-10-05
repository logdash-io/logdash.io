<script lang="ts">
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import UserIcon from '$lib/domains/shared/icons/UserIcon.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';

  type Props = {
    name: string;
    avatar?: string | null;
    menu?: Snippet<[close: () => void]>;
  };

  const { name, avatar, menu }: Props = $props();
</script>

{#if menu}
  <Tooltip
    class="min-w-0"
    content={menu}
    interactive={true}
    placement="bottom"
    align="left"
    trigger="click"
    closeOnOutsideTooltipClick={true}
  >
    <button
      class="group hover:bg-surface-root-hover-bg flex h-7.5 max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left"
    >
      {@render profile()}
      <ChevronDownIcon
        class="text-fg-muted group-hover:text-fg-secondary transition-ink size-3.5 shrink-0"
      />
    </button>
  </Tooltip>
{:else}
  <span class="flex h-7.5 min-w-0 items-center gap-2 px-1.5">
    {@render profile()}
  </span>
{/if}

{#snippet profile()}
  <span
    class="bg-surface-200-bg flex size-5.5 shrink-0 items-center justify-center overflow-hidden rounded-md"
  >
    {#if avatar}
      <img class="size-full object-cover" src={avatar} alt="" />
    {:else}
      <UserIcon class="text-fg-secondary size-3.5" />
    {/if}
  </span>
  <span class="truncate text-sm font-[550]">{name}</span>
{/snippet}
