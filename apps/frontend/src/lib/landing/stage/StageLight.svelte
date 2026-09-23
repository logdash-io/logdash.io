<script lang="ts">
  import type { ClassValue } from 'svelte/elements';
  import { stageLight } from './stage-light';
  import {
    STAGE_FALLBACK,
    STAGE_LIGHTING,
    type StagePreset,
  } from './stage-lighting';

  type Props = {
    preset: StagePreset;
    class?: ClassValue;
  };

  const { preset, class: className }: Props = $props();

  let isLit = $state(false);

  const lighting = $derived(STAGE_LIGHTING[preset]);
  const fallback = $derived(STAGE_FALLBACK[preset]);

  function onReady(ready: boolean): void {
    isLit = ready;
  }
</script>

<div
  class={[
    'stage',
    className,
    { 'is-lit': isLit, 'fades-in': lighting.fadeTop },
  ]}
  style:--stage-spot={fallback.spot}
  style:--stage-floor={fallback.floor}
  aria-hidden="true"
>
  <canvas
    class={['absolute inset-0 size-full', { invisible: !isLit }]}
    use:stageLight={{ lighting, onReady }}
  ></canvas>
</div>

<style>
  .stage {
    overflow: hidden;
    background:
      radial-gradient(
        56% 70% at var(--stage-spot),
        color-mix(in srgb, var(--color-base-content) 18%, transparent),
        transparent
      ),
      linear-gradient(
        var(--stage-floor),
        var(--color-base-300) 8%,
        color-mix(in srgb, var(--color-base-content) 10%, var(--color-base-300))
          100%
      );
  }

  .stage.fades-in {
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 40%);
    mask-image: linear-gradient(180deg, transparent 0%, #000 40%);
  }

  .stage::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px 180px;
    mix-blend-mode: soft-light;
    opacity: 0.5;
  }

  .stage.is-lit {
    background: none;
    -webkit-mask-image: none;
    mask-image: none;
  }

  .stage.is-lit::after {
    content: none;
  }
</style>
