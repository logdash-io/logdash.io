<script lang="ts">
  import { resolve } from '$app/paths';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    name: string;
    clusterId: string;
    projectId: string;
    children?: Snippet;
  };

  const { name, clusterId, projectId, children }: Props = $props();
</script>

<li
  class="hover:bg-surface-25-hover-bg relative flex h-12 items-center gap-3 rounded-lg px-3 text-sm"
>
  <CubeIcon class="text-fg-muted size-4 shrink-0" />
  <a
    href={resolve('/app/domains/[cluster_id]/[project_id]', {
      cluster_id: clusterId,
      project_id: projectId,
    })}
    class="focus-visible:after:outline-brand min-w-0 truncate font-medium outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:-outline-offset-2 focus-visible:after:outline-2"
  >
    {name}
  </a>

  <span class="ml-auto flex shrink-0 items-center gap-2">
    {@render children?.()}
  </span>
</li>
