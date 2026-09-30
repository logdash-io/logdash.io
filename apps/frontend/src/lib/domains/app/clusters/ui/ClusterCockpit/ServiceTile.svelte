<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ServiceStatus } from '$lib/domains/app/clusters/domain/service-status.js';
  import { StatusBadge } from '@logdash/hyper-ui/features';
  import type { Snippet } from 'svelte';

  type Props = {
    name: string;
    url: string | null;
    status: ServiceStatus;
    clusterId: string;
    projectId: string;
    children?: Snippet;
  };

  const { name, url, status, clusterId, projectId, children }: Props = $props();
</script>

<div
  class="bg-surface-elevated hover:bg-surface-100 relative flex min-w-0 flex-col justify-between gap-4 p-4"
>
  <div class="flex min-w-0 flex-col gap-0.5">
    <div class="flex items-center justify-between gap-3">
      <a
        href={resolve('/app/domains/[cluster_id]/[project_id]', {
          cluster_id: clusterId,
          project_id: projectId,
        })}
        class="focus-visible:after:outline-brand min-w-0 truncate text-base font-medium outline-none after:absolute after:inset-0 focus-visible:after:-outline-offset-2 focus-visible:after:outline-2"
      >
        {name}
      </a>

      <div class="shrink-0">
        <StatusBadge {status} showText={true} />
      </div>
    </div>

    <span class="text-neutral-500 truncate text-sm sm:min-h-5">{url}</span>
  </div>

  {#if children}
    <div class="flex h-5 items-center">
      {@render children()}
    </div>
  {/if}
</div>
