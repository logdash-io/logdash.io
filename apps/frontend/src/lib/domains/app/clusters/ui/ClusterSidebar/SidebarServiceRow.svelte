<script lang="ts">
  import { SERVICE_STATUS_DOT } from '$lib/domains/app/clusters/domain/service-status.js';
  import type { MonitorStatus } from '$lib/domains/app/projects/application/monitor-pings';
  import { Spinner, Tooltip } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import SidebarMenuItem from './SidebarMenuItem.svelte';

  type Props = {
    label: string;
    host?: string | null;
    status?: MonitorStatus;
    pending?: boolean;
    active?: boolean;
    disabled?: boolean;
    onclick?: () => void;
    tooltip?: Snippet;
    children?: Snippet;
  };

  const {
    label,
    host,
    status = 'unknown',
    pending = false,
    active = false,
    disabled = false,
    onclick,
    tooltip,
    children,
  }: Props = $props();
</script>

<SidebarMenuItem {onclick} isActive={active} {disabled} class="pl-5">
  <span class="flex size-4 shrink-0 items-center justify-center">
    {#if pending}
      <Spinner class="text-neutral-500 size-3" />
    {:else if tooltip}
      <Tooltip content={tooltip} placement="bottom">
        {@render dot()}
      </Tooltip>
    {:else}
      {@render dot()}
    {/if}
  </span>

  {#if children}
    {@render children()}
  {:else}
    <span class="truncate">{label}</span>
  {/if}

  {#if host}
    <span class="text-neutral-600 ml-auto min-w-6 shrink-[4] truncate text-xs">
      {host}
    </span>
  {/if}
</SidebarMenuItem>

{#snippet dot()}
  <span class={['size-1.5 rounded-full', SERVICE_STATUS_DOT[status]]}></span>
{/snippet}
