<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    SERVICE_STATUS_DOT,
    SERVICE_STATUS_LABEL,
    type ServiceStatus,
  } from '$lib/domains/app/clusters/domain/service-status.js';
  import { Badge } from '@logdash/hyper-ui/presentational';
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
  class="hover:bg-surface-50-hover-bg relative flex h-11 items-center gap-3 rounded-lg px-3 text-[13px]"
>
  <a
    href={resolve('/app/domains/[cluster_id]/[project_id]', {
      cluster_id: clusterId,
      project_id: projectId,
    })}
    class="focus-visible:after:outline-brand shrink-0 truncate font-medium outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:-outline-offset-2 focus-visible:after:outline-2"
  >
    {name}
  </a>

  {#if url}
    <span class="text-fg-muted min-w-0 truncate max-sm:hidden">{url}</span>
  {/if}

  <span class="ml-auto flex shrink-0 items-center gap-2">
    {@render children?.()}

    <Badge variant="outline">
      <span
        class={['size-1.5 shrink-0 rounded-full', SERVICE_STATUS_DOT[status]]}
      ></span>
      {SERVICE_STATUS_LABEL[status]}
    </Badge>
  </span>
</div>
