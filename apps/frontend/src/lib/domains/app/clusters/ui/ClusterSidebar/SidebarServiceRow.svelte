<script lang="ts">
  import {
    SERVICE_STATUS_DOT,
    SERVICE_STATUS_LABEL,
  } from '$lib/domains/app/clusters/domain/service-status.js';
  import type { MonitorStatus } from '$lib/domains/app/projects/application/monitor-pings';
  import { Spinner, Tooltip } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
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
    status,
    pending = false,
    active = false,
    disabled = false,
    onclick,
    tooltip,
    children,
  }: Props = $props();
</script>

<SidebarMenuItem {onclick} isActive={active} {disabled} nested>
  <span class="flex size-4 shrink-0 items-center justify-center">
    {#if pending}
      <Spinner class="text-fg-muted size-3" />
    {:else if !status}
      <CubeIcon class="text-fg-muted size-3.5" />
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

  {#if status}
    {#if status !== 'up'}
      <span
        class={[
          'ml-auto shrink-0 text-[13px]',
          {
            'text-fg-muted': status === 'unknown',
            'text-warning': status === 'degraded',
            'text-error': status === 'down',
          },
        ]}
      >
        {SERVICE_STATUS_LABEL[status]}
      </span>
    {/if}
  {:else if host}
    <span class="text-fg-faint ml-auto min-w-6 shrink-[4] truncate text-[13px]">
      {host}
    </span>
  {/if}
</SidebarMenuItem>

{#snippet dot()}
  <span
    class={['size-1.5 rounded-full', SERVICE_STATUS_DOT[status ?? 'unknown']]}
  ></span>
{/snippet}
