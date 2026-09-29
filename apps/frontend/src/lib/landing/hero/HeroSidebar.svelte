<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import ProjectTile from '$lib/domains/app/clusters/ui/ClusterSidebar/ProjectTile.svelte';
  import ChevronDownIcon from '$lib/domains/shared/icons/ChevronDownIcon.svelte';
  import GridIcon from '$lib/domains/shared/icons/GridIcon.svelte';
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import LightbulbIcon from '$lib/domains/shared/icons/LightbulbIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import UserIcon from '$lib/domains/shared/icons/UserIcon.svelte';
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import type { Component } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { blur } from 'svelte/transition';
  import { statusFromHttpPings, type MonitorStatus } from './hero-pings';
  import { showcaseClusterName } from './hero-showcase';
  import TypewriterText from './TypewriterText.svelte';

  type IconComponent = Component<{ class?: ClassValue }>;

  type ServiceRow = {
    name: string;
    status: MonitorStatus;
    pending: boolean;
  };

  const STATUS_DOT: Record<MonitorStatus, string> = {
    up: 'bg-success',
    down: 'bg-error',
    degraded: 'bg-warning',
    unknown: 'bg-neutral-600',
  };

  const ROW_CLASS =
    'flex h-7 w-full min-w-0 shrink-0 items-center gap-2 rounded-lg px-2 text-[13px] select-none';

  const CLUSTER_SWAP_MS = 240;
  const CLUSTER_SWAP_BLUR_PX = 4;

  const phase = $derived(anonymousPreviewState.phase);
  const clusterName = $derived(
    showcaseClusterName(phase, anonymousPreviewState.clusterName),
  );

  const service = $derived.by<ServiceRow>(() => {
    const host = anonymousPreviewState.previewHost;

    if (phase === 'creating') {
      return { name: host ?? 'Setting up', status: 'unknown', pending: true };
    }

    if (phase === 'idle' || !anonymousPreviewState.preview || !host) {
      return demoRow();
    }

    return {
      name: host,
      status:
        phase === 'previewing'
          ? statusFromHttpPings(anonymousPreviewState.pings)
          : 'unknown',
      pending: false,
    };
  });

  function demoRow(): ServiceRow {
    const demo = anonymousPreviewState.demo;

    return {
      name: demo.monitor?.name ?? '',
      status: demo.pings.length ? statusFromHttpPings(demo.pings) : 'unknown',
      pending: !demo.pings.length,
    };
  }
</script>

<aside
  class="border-hairline bg-surface-root hidden w-64 shrink-0 flex-col border-r xl:flex"
  aria-hidden="true"
>
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-3 pt-2">
    <div class={[ROW_CLASS, 'text-neutral-400']}>
      <GridIcon class="text-neutral-500 size-4 shrink-0" />
      <span class="truncate">All projects</span>
    </div>

    <div class="flex flex-col gap-px">
      <div class="text-neutral-500 flex h-7 shrink-0 items-center px-2 text-xs">
        Projects
      </div>

      <div class={[ROW_CLASS, 'text-neutral-400']}>
        <ProjectTile name={clusterName} />
        {#key clusterName}
          <span
            class="truncate"
            in:blur={{
              duration: CLUSTER_SWAP_MS,
              easing: cubicOut,
              amount: prefersReducedMotion.current ? 0 : CLUSTER_SWAP_BLUR_PX,
            }}
          >
            {clusterName}
          </span>
        {/key}
        <ChevronDownIcon class="text-neutral-600 size-3 shrink-0" />
      </div>

      {@render navRow(HomeIcon, 'Home')}
      {@render navRow(PublicDashboardIcon, 'Status pages')}
      {@render navRow(SettingsIcon, 'Settings')}

      <div class="border-hairline my-1 ml-8 shrink-0 border-t"></div>

      <div class={[ROW_CLASS, 'bg-surface-100 text-fg-default pl-8']}>
        <span class="flex size-3.5 shrink-0 items-center justify-center">
          {#if service.pending}
            <Spinner class="text-neutral-500 size-3" />
          {:else}
            <span
              class={['size-1.5 rounded-full', STATUS_DOT[service.status]]}
            ></span>
          {/if}
        </span>
        <TypewriterText text={service.name} />
      </div>

      <div class={[ROW_CLASS, 'text-neutral-500 pl-8']}>
        <PlusIcon class="size-3.5 shrink-0" />
        <span class="truncate">New service</span>
      </div>
    </div>
  </div>

  <div class="flex items-center gap-1 px-3 pt-4 pb-3">
    <span class="flex min-w-0 flex-1 items-center gap-2 py-1 pr-1.5 pl-1">
      <span
        class="bg-surface-150 flex size-6 shrink-0 items-center justify-center rounded-full"
      >
        <UserIcon class="text-neutral-300 size-3.5" />
      </span>
      <span class="truncate text-[13px]">Anonymous</span>
    </span>

    <span
      class="text-neutral-400 flex size-7 shrink-0 items-center justify-center"
    >
      <LightbulbIcon class="size-4" />
    </span>

    <span
      class="border-border-default text-neutral-400 flex h-6 shrink-0 items-center rounded-full border px-2 text-xs"
    >
      Free
    </span>
  </div>
</aside>

{#snippet navRow(Icon: IconComponent, label: string)}
  <div class={[ROW_CLASS, 'text-neutral-400 pl-8']}>
    <Icon class="text-neutral-500 size-3.5 shrink-0" />
    <span class="truncate">{label}</span>
  </div>
{/snippet}
