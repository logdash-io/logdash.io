<script lang="ts">
  import { resolve } from '$app/paths';
  import { ArrowRightIcon } from 'lucide-svelte';
  import FakeMonitoringTile from './unconfigured/FakeMonitoringTile.svelte';

  type Props = {
    clusterId: string;
    projectId: string;
  };

  const { clusterId, projectId }: Props = $props();
</script>

{#snippet configureOverlay()}
  <a
    href={resolve('/app/clusters/[cluster_id]/[project_id]/monitoring', {
      cluster_id: clusterId,
      project_id: projectId,
    })}
    class="z-50 absolute group inset-0 flex items-center justify-center bg-base-300/60"
  >
    <span class="btn btn-secondary gap-2">
      Finish monitoring setup
      <ArrowRightIcon class="h-4 w-4" />
    </span>
  </a>
{/snippet}

<div
  class="ld-card-bg ld-card-border ld-card-rounding relative w-full overflow-hidden"
>
  <div class="pointer-events-none select-none opacity-40 blur-[1px]">
    <FakeMonitoringTile />
  </div>
  {@render configureOverlay()}
</div>
