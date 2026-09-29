<script lang="ts">
  import { StatusBadge } from '@logdash/hyper-ui/features';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import { getStatusConfig } from '$lib/domains/app/projects/domain/monitoring/status-config.js';
  import { displayUrl, isNameFromUrl } from '$lib/domains/shared/utils/url.js';

  type Props = {
    name: string;
    url?: string;
    status: 'up' | 'down' | 'degraded' | 'unknown';
    showArrow?: boolean;
  };

  const { name, url, status, showArrow = false }: Props = $props();

  const statusConfig = $derived(getStatusConfig(status));
  const visibleUrl = $derived(url && !isNameFromUrl(name, url) ? url : null);
</script>

<div class="flex w-full items-start justify-between gap-4">
  <div class="flex min-w-0 items-start gap-3">
    <div class="flex h-7 shrink-0 items-center">
      <StatusBadge {status} />
    </div>

    <div class="flex min-w-0 flex-col">
      <h4 class="text-fg-default truncate text-lg font-medium">
        {name}
      </h4>

      {#if visibleUrl}
        <!-- eslint-disable svelte/no-navigation-without-resolve -- external monitored URL -->
        <a
          href={visibleUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="text-neutral-500 hover:text-neutral-300 transition-ink pointer-events-auto self-start max-w-full truncate text-sm focus-visible:text-neutral-300"
        >
          {displayUrl(visibleUrl)}
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      {/if}
    </div>
  </div>

  <div class="flex h-7 shrink-0 items-center gap-2 text-right">
    <div class={['text-sm font-medium', statusConfig.color]}>
      {statusConfig.text}
    </div>

    {#if showArrow}
      <ChevronRightIcon
        class="size-4 text-neutral-600 group-hover:text-fg-default"
      />
    {/if}
  </div>
</div>
