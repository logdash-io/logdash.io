<script lang="ts">
  import { stageShader } from './stage-shader';

  let isShaded = $state(false);

  function onReady(ready: boolean): void {
    isShaded = ready;
  }
</script>

<div
  class={[
    'hero-stage absolute inset-0 mx-auto max-w-[1920px] lg:inset-x-3 lg:rounded-2xl',
    { 'is-shaded': isShaded },
  ]}
  aria-hidden="true"
>
  <canvas
    class={['absolute inset-0 size-full', { invisible: !isShaded }]}
    use:stageShader={{ onReady }}
  ></canvas>
</div>

<style>
  .hero-stage {
    --stage-fade-in: linear-gradient(180deg, transparent 0%, #000 40%);
    overflow: hidden;
    background:
      radial-gradient(
        56% 70% at 50% 100%,
        color-mix(in srgb, var(--color-base-content) 18%, transparent),
        transparent
      ),
      linear-gradient(
        180deg,
        var(--color-base-300) 8%,
        color-mix(in srgb, var(--color-base-content) 10%, var(--color-base-300))
          100%
      );
    -webkit-mask-image: var(--stage-fade-in);
    mask-image: var(--stage-fade-in);
  }

  .hero-stage::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 180px 180px;
    mix-blend-mode: soft-light;
    opacity: 0.5;
  }

  .hero-stage.is-shaded {
    background: none;
    -webkit-mask-image: none;
    mask-image: none;
  }

  .hero-stage.is-shaded::after {
    content: none;
  }
</style>
