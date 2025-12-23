<script lang="ts">
  import { Feature } from '$lib/domains/shared/types.js';
  import { ArrowRightIcon } from 'lucide-svelte';
  import FakeMonitoringTile from './unconfigured/FakeMonitoringTile.svelte';

  type Props = {
    feature: Feature.MONITORING;
    basePath: string;
    delayIn?: number;
  };

  const { feature, basePath, delayIn = 0 }: Props = $props();

  const featurePath = $derived(`${basePath}/monitoring`);
</script>

{#snippet configureOverlay()}
  <a
    href={featurePath}
    class="z-50 absolute inset-0 flex items-center justify-center bg-base-300/60 transition-all"
  >
    <span class="btn btn-primary btn-sm gap-2">
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
