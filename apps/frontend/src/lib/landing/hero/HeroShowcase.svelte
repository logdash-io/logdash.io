<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import { previewNameFromUrl } from '$lib/domains/anonymous/domain/anonymous-preview';
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import LogsIcon from '$lib/domains/shared/icons/LogsIcon.svelte';
  import MetricsIcon from '$lib/domains/shared/icons/MetricsIcon.svelte';
  import MonitoringIcon from '$lib/domains/shared/icons/MonitoringIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import type { Component } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { MediaQuery } from 'svelte/reactivity';
  import { match } from 'ts-pattern';
  import { HERO_SHOWCASE_ID } from './hero-anchors';
  import HeroLogsPanel from './HeroLogsPanel.svelte';
  import HeroMetricsColumn from './HeroMetricsColumn.svelte';
  import HeroMonitorTile from './HeroMonitorTile.svelte';
  import HeroSidebar from './HeroSidebar.svelte';

  type WindowBarStatus = {
    label: string;
    dotClass: string;
  };

  type ServiceTab = {
    label: string;
    icon: Component<{ class?: ClassValue }>;
    active: boolean;
  };

  /** The tabs a service has in the app, with its overview open. */
  const SERVICE_TABS: ServiceTab[] = [
    { label: 'Overview', icon: HomeIcon, active: true },
    { label: 'Logs', icon: LogsIcon, active: false },
    { label: 'Metrics', icon: MetricsIcon, active: false },
    { label: 'Monitoring', icon: MonitoringIcon, active: false },
    { label: 'Settings', icon: SettingsIcon, active: false },
  ];

  /** Below lg the frame grows with its content and the tail shows this many rows. */
  const LOG_ROWS = 6;
  const largeFrame = new MediaQuery('(min-width: 1024px)');

  const phase = $derived(anonymousPreviewState.phase);

  const host = $derived(
    anonymousPreviewState.preview
      ? previewNameFromUrl(anonymousPreviewState.preview.url)
      : (anonymousPreviewState.demo.monitor?.name ?? 'logdash.io'),
  );

  const status = $derived<WindowBarStatus>(
    match(phase)
      .with('creating', () => ({
        label: 'Starting',
        dotClass: 'bg-warning animate-pulse',
      }))
      .with('previewing', 'idle', () => ({
        label: 'Live',
        dotClass: 'bg-success',
      }))
      .with('ended', () => ({
        label: 'Ended',
        dotClass: 'bg-neutral-600',
      }))
      .with('error', () => ({
        label: 'Stopped',
        dotClass: 'bg-error',
      }))
      .exhaustive(),
  );
</script>

<!--
  Frame column = the nav column. From lg the frame bleeds 16px past it on both
  sides (lg:-mx-4) and every inner edge is padded 16px, so what is inside the
  frame sits on the nav's x, not the frame's ring. Simon: "left aligned content
  should be matching topbar's content width, always".

  From lg the frame keeps a 16:9 ratio and its panels share the height the way
  a service page does in the app: sidebar, then the monitor over the log tail,
  with the metrics column beside them.
-->
<div
  class="relative mx-auto w-full max-w-landing px-4 pt-8 pb-8 sm:px-6 lg:px-10 lg:pt-12 lg:pb-14"
>
  <div class="lg:-mx-4">
    <div
      id={HERO_SHOWCASE_ID}
      class="ring-hairline bg-base-200 relative flex overflow-hidden rounded-xl shadow-[0_32px_64px_-24px_rgba(0,0,0,0.7)] ring-1 lg:aspect-video"
    >
      <HeroSidebar />

      <div class="flex min-w-0 flex-1 flex-col">
        <div
          class="border-hairline flex h-11 shrink-0 items-center gap-3 border-b px-4"
        >
          <nav class="hidden items-center gap-1 xl:flex" aria-hidden="true">
            {#each SERVICE_TABS as tab (tab.label)}
              <span
                class={[
                  'flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm',
                  tab.active
                    ? 'bg-base-100 text-base-content'
                    : 'text-neutral-500',
                ]}
              >
                <tab.icon class="size-3.5 shrink-0" />
                {tab.label}
              </span>
            {/each}
          </nav>

          <span class="text-neutral-500 min-w-0 truncate text-sm xl:hidden">
            <span class="hidden sm:inline">
              My first cluster
              <span class="text-neutral-700">/</span>
            </span>
            <span class="text-base-content font-medium">{host}</span>
          </span>

          <span
            class="text-neutral-400 ml-auto flex shrink-0 items-center gap-1.5 text-xs"
          >
            <span class={['size-1.5 rounded-full', status.dotClass]}></span>
            {status.label}
          </span>
        </div>

        <div class="bg-hairline flex min-h-0 flex-1 gap-px">
          <div class="bg-base-200 flex min-h-0 min-w-0 flex-1 flex-col">
            <div class="border-hairline shrink-0 border-b">
              <HeroMonitorTile />
            </div>

            <HeroLogsPanel rows={LOG_ROWS} fit={largeFrame.current} />
          </div>

          <div class="bg-base-200 hidden w-64 shrink-0 lg:flex xl:w-72">
            <HeroMetricsColumn />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
