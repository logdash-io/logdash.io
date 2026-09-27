<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import CubeIcon from '$lib/domains/shared/icons/CubeIcon.svelte';
  import HexagonIcon from '$lib/domains/shared/icons/HexagonIcon.svelte';
  import HomeIcon from '$lib/domains/shared/icons/HomeIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import PublicDashboardIcon from '$lib/domains/shared/icons/PublicDashboardIcon.svelte';
  import SettingsIcon from '$lib/domains/shared/icons/SettingsIcon.svelte';
  import { Spinner } from '@logdash/hyper-ui/presentational';
  import { ChevronsUpDownIcon, SearchIcon, UserRoundIcon } from 'lucide-svelte';
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

  const CLUSTER_SWAP_MS = 240;
  const CLUSTER_SWAP_BLUR_PX = 4;

  const phase = $derived(anonymousPreviewState.phase);
  const clusterName = $derived(showcaseClusterName(phase));

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

  function rowClass(active: boolean): ClassValue {
    return [
      'flex h-8 items-center gap-2 rounded-lg px-2 text-sm',
      active ? 'bg-surface-100 text-fg-default' : 'text-neutral-400',
    ];
  }
</script>

<aside
  class="border-hairline bg-surface-root hidden w-64 shrink-0 flex-col border-r xl:flex"
  aria-hidden="true"
>
  <div class="flex items-center gap-1 px-4 pt-3">
    <div class="flex min-w-0 flex-1 items-center gap-2 py-1 pr-2 pl-1">
      <span
        class="border-border-default bg-surface-elevated flex size-6 shrink-0 items-center justify-center rounded-md border"
      >
        <CubeIcon class="size-3.5" />
      </span>
      {#key clusterName}
        <span
          class="truncate text-sm font-medium"
          in:blur={{
            duration: CLUSTER_SWAP_MS,
            easing: cubicOut,
            amount: prefersReducedMotion.current ? 0 : CLUSTER_SWAP_BLUR_PX,
          }}
        >
          {clusterName}
        </span>
      {/key}
      <ChevronsUpDownIcon class="text-neutral-600 size-3.5 shrink-0" />
    </div>

    {@render iconButton(PlusIcon)}
  </div>

  <div class="px-4 pt-3">
    <div
      class="border-border-default bg-surface-elevated text-neutral-500 flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm"
    >
      <SearchIcon class="size-3.5 shrink-0 text-neutral-600" />
      <span class="flex-1">Search</span>
      <kbd class="font-sans text-[11px]">⌘K</kbd>
    </div>
  </div>

  <nav class="flex flex-col gap-0.5 px-4 pt-4">
    {@render row(HomeIcon, 'Home')}
    {@render row(PublicDashboardIcon, 'Status pages')}
    {@render row(SettingsIcon, 'Settings')}
  </nav>

  <div class="flex flex-col gap-0.5 px-4 pt-5">
    <span class="text-neutral-500 px-2 pb-1 text-xs">Services</span>

    <div class={rowClass(true)}>
      <HexagonIcon class="size-4 shrink-0" />
      <TypewriterText text={service.name} />
      {#if service.pending}
        <Spinner class="text-neutral-500 ml-auto size-3 shrink-0" />
      {:else}
        <span
          class={[
            'ml-auto size-1.5 shrink-0 rounded-full',
            STATUS_DOT[service.status],
          ]}
        ></span>
      {/if}
    </div>

    <div
      class="text-neutral-500 flex h-8 items-center gap-2 rounded-lg px-2 text-sm"
    >
      <PlusIcon class="size-4 shrink-0 text-neutral-600" />
      <span>New service</span>
    </div>
  </div>

  <div class="mt-auto px-4 py-3">
    <div class="flex items-center gap-2.5 px-1 py-1">
      <span
        class="bg-surface-100 flex size-7 shrink-0 items-center justify-center rounded-full"
      >
        <UserRoundIcon class="text-neutral-400 size-3.5" />
      </span>
      <span class="flex min-w-0 flex-col">
        <span class="truncate text-sm font-medium">Anonymous</span>
        <span class="text-neutral-500 text-xs">Free plan</span>
      </span>
      <ChevronRightIcon class="text-neutral-600 ml-auto size-3.5 shrink-0" />
    </div>
  </div>
</aside>

{#snippet iconButton(Icon: IconComponent)}
  <span
    class="text-neutral-500 flex size-7 shrink-0 items-center justify-center rounded-md"
  >
    <Icon class="size-4" />
  </span>
{/snippet}

{#snippet row(Icon: IconComponent, label: string)}
  <div class={rowClass(false)}>
    <Icon class="size-4 shrink-0" />
    <span class="truncate">{label}</span>
  </div>
{/snippet}
