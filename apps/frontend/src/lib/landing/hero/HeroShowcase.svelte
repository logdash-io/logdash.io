<script module lang="ts">
  export const HERO_SHOWCASE_ID = 'hero-showcase';
</script>

<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import { previewNameFromUrl } from '$lib/domains/anonymous/domain/anonymous-preview';
  import FakeLogs from '$lib/landing/FakeLogs.svelte';
  import { match } from 'ts-pattern';
  import HeroMonitorTile from './HeroMonitorTile.svelte';

  type WindowBarStatus = {
    label: string;
    dotClass: string;
  };

  const host = $derived(
    anonymousPreviewState.preview
      ? previewNameFromUrl(anonymousPreviewState.preview.url)
      : 'yourapp.com',
  );

  const status = $derived<WindowBarStatus>(
    match(anonymousPreviewState.phase)
      .with('creating', () => ({
        label: 'Starting',
        dotClass: 'bg-warning animate-pulse',
      }))
      .with('previewing', () => ({
        label: 'Live',
        dotClass: 'bg-success',
      }))
      .with('ended', () => ({
        label: 'Ended',
        dotClass: 'bg-base-content/30',
      }))
      .with('error', () => ({
        label: 'Stopped',
        dotClass: 'bg-error',
      }))
      .with('idle', () => ({
        label: 'Live demo',
        dotClass: 'bg-success',
      }))
      .exhaustive(),
  );
</script>

<div id={HERO_SHOWCASE_ID} class="ld-radial-glow relative w-full">
  <div
    class="ld-card-base relative z-1 rounded-[2rem] p-1.5 shadow-[0_24px_64px_rgba(0,0,0,0.45)] sm:p-2"
  >
    <div
      class="border-base-100/60 bg-base-300/80 overflow-hidden rounded-[1.6rem] border"
    >
      <div
        class="border-base-100/60 flex h-12 items-center gap-3 border-b px-4 sm:px-5"
      >
        <div class="hidden shrink-0 items-center gap-1.5 sm:flex">
          <span class="bg-base-content/15 size-2.5 rounded-full"></span>
          <span class="bg-base-content/15 size-2.5 rounded-full"></span>
          <span class="bg-base-content/15 size-2.5 rounded-full"></span>
        </div>

        <span
          class="text-base-content/50 min-w-0 truncate font-mono text-xs sm:text-sm"
        >
          <span class="hidden sm:inline">
            My first cluster
            <span class="text-base-content/25">·</span>
          </span>
          <span class="text-base-content/70">{host}</span>
        </span>

        <span
          class="border-base-content/10 bg-base-200/70 ml-auto flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1"
        >
          <span class={['size-1.5 rounded-full', status.dotClass]}></span>
          <span class="text-base-content/70 text-[11px] font-medium">
            {status.label}
          </span>
        </span>
      </div>

      <div class="grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-3">
        <div class="lg:col-span-2 lg:h-full">
          <HeroMonitorTile />
        </div>

        <div class="lg:col-span-1 lg:h-full">
          <FakeLogs />
        </div>
      </div>
    </div>
  </div>
</div>
