<script lang="ts">
  import UserIcon from '$lib/domains/shared/icons/UserIcon.svelte';
  import FeedbackButton from '$lib/domains/shared/ui/components/FeedbackButton.svelte';
  import { Tooltip } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';

  type Props = {
    name: string;
    plan: string;
    avatar?: string | null;
    menu?: Snippet<[close: () => void]>;
  };

  const { name, plan, avatar, menu }: Props = $props();
</script>

<div class="flex items-center gap-1 px-2 pt-4 pb-3">
  {#if menu}
    <Tooltip
      class="min-w-0 flex-1"
      content={menu}
      interactive={true}
      placement="top"
      align="left"
      trigger="click"
      closeOnOutsideTooltipClick={true}
    >
      <button
        class="hover:bg-surface-hover flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 text-left"
      >
        {@render profile()}
      </button>
    </Tooltip>
  {:else}
    <span class="flex min-w-0 flex-1 items-center gap-2 py-1 pr-1.5 pl-1">
      {@render profile()}
    </span>
  {/if}

  <FeedbackButton />

  <span
    class="border-border-default text-neutral-400 flex h-6 shrink-0 items-center rounded-full border px-2 text-xs"
  >
    {plan}
  </span>
</div>

{#snippet profile()}
  <span
    class="bg-surface-150 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full"
  >
    {#if avatar}
      <img class="size-full object-cover" src={avatar} alt="" />
    {:else}
      <UserIcon class="text-neutral-300 size-3.5" />
    {/if}
  </span>
  <span class="truncate text-[13px]">{name}</span>
{/snippet}
