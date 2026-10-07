<script lang="ts">
  import { anonymousPreviewState } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import type { WatchHistory } from '$lib/domains/anonymous/domain/watch-history';
  import Breadcrumbs from '$lib/domains/app/clusters/ui/ClusterShell/Breadcrumbs.svelte';
  import LiveIndicator from '$lib/domains/app/clusters/ui/ClusterShell/LiveIndicator.svelte';
  import TopBar from '$lib/domains/app/clusters/ui/ClusterShell/TopBar.svelte';
  import SidebarAccountRow from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarAccountRow.svelte';
  import SidebarDomainNav from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarDomainNav.svelte';
  import SidebarDomainRow from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarDomainRow.svelte';
  import SidebarFooter from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarFooter.svelte';
  import SidebarLayout from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarLayout.svelte';
  import SidebarNewServiceRow from '$lib/domains/app/clusters/ui/ClusterSidebar/SidebarNewServiceRow.svelte';
  import { fillEmptySlots } from '$lib/domains/app/projects/domain/monitoring/ping-bucket';
  import ShieldCheckIcon from '$lib/domains/shared/icons/ShieldCheckIcon.svelte';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import TrashIcon from '$lib/domains/shared/icons/TrashIcon.svelte';
  import {
    SettingsCard,
    SettingsCardItem,
  } from '$lib/domains/shared/ui/components/settings-card';
  import {
    TOOLBAR_GROUP,
    TOOLBAR_GROUP_OPTION,
  } from '$lib/domains/shared/ui/components/toolbar';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { UptimeBars } from '@logdash/hyper-ui/features';
  import { Button } from '@logdash/hyper-ui/presentational';
  import type { Snippet } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { blur } from 'svelte/transition';
  import { match } from 'ts-pattern';
  import HeroMonitor from './HeroMonitor.svelte';
  import { heroLive, heroMonitor } from './hero-dashboard';
  import { showcaseClusterName } from './hero-showcase';
  import TypewriterText from './TypewriterText.svelte';

  type Props = {
    covered: boolean;
    toggle: Snippet;
  };

  const { covered, toggle }: Props = $props();

  const DOMAIN_SWAP_MS = 240;
  const DOMAIN_SWAP_BLUR_PX = 4;
  const HISTORY_HOURS = 90;

  const phase = $derived(anonymousPreviewState.phase);
  const domainName = $derived(
    showcaseClusterName(phase, anonymousPreviewState.clusterName),
  );
  const monitor = $derived(
    heroMonitor({
      phase,
      previewHost: anonymousPreviewState.previewHost,
      previewUrl: anonymousPreviewState.previewUrl,
      hasPreview: anonymousPreviewState.preview !== null,
      pings: anonymousPreviewState.pings,
      demo: anonymousPreviewState.demo,
    }),
  );
  const live = $derived(heroLive(phase));
  const watched = $derived(anonymousPreviewState.watchHistory);
  const hours = $derived(
    phase === 'idle'
      ? anonymousPreviewState.demo.hours
      : anonymousPreviewState.previewHours,
  );
  const history = $derived(
    fillEmptySlots(
      hours.length ? hours : Array.from({ length: HISTORY_HOURS }, () => null),
      'hour',
    ),
  );

  function watchedLabel(history: WatchHistory): string {
    const since = history.since.toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
    });
    const outages = match(history.outages)
      .with(0, () => 'no outages')
      .with(1, () => '1 outage')
      .otherwise((count) => `${count} outages`);

    return `Watched since ${since} · ${outages}`;
  }
</script>

<aside
  class="bg-surface-root-bg hidden w-67 shrink-0 flex-col lg:flex"
  aria-hidden="true"
  inert
>
  <SidebarLayout>
    <SidebarDomainRow name={domainName} expanded={true}>
      {#key domainName}
        <span
          class="truncate"
          in:blur={{
            duration: DOMAIN_SWAP_MS,
            easing: cubicOut,
            amount: prefersReducedMotion.current ? 0 : DOMAIN_SWAP_BLUR_PX,
          }}
        >
          {domainName}
        </span>
      {/key}
    </SidebarDomainRow>

    <SidebarDomainNav
      active="uptime"
      down={monitor.status === 'down' ? 1 : 0}
    />

    <SidebarNewServiceRow />

    {#snippet header()}
      <SidebarAccountRow name="Anonymous" />
    {/snippet}

    {#snippet footer()}
      <SidebarFooter plan="Free" />
    {/snippet}
  </SidebarLayout>
</aside>

<div
  class="bg-surface-50-bg lg:edge-over @container flex min-w-0 flex-1 flex-col lg:my-2 lg:mr-2 lg:overflow-hidden lg:rounded-xl"
  inert={covered}
>
  <TopBar>
    <div class="flex min-w-0 flex-1 items-center">
      {#if monitor.name}
        <Breadcrumbs
          crumbs={[
            { label: domainName },
            { label: 'Uptime' },
            { label: monitor.name },
          ]}
        >
          {#snippet current()}
            <TypewriterText text={monitor.name} />
          {/snippet}
        </Breadcrumbs>
      {:else}
        <Breadcrumbs crumbs={[{ label: domainName }, { label: 'Uptime' }]} />
      {/if}
    </div>

    <div class="flex items-center gap-3">
      <LiveIndicator label={live.label} dot={live.dot} pending={live.pending} />
      <div class={[TOOLBAR_GROUP, 'max-sm:hidden']} aria-hidden="true">
        <span
          class={[TOOLBAR_GROUP_OPTION, 'bg-surface-150-bg text-fg-default']}
        >
          90 hours
        </span>
        <span class={[TOOLBAR_GROUP_OPTION, 'text-fg-tertiary']}>90 days</span>
      </div>
      {@render toggle()}
    </div>
  </TopBar>

  <div class="flex min-h-0 flex-1 flex-col gap-2 p-2">
    <HeroMonitor />

    <Well label="Uptime history" title="Uptime history">
      {#snippet actions()}
        {#if watched}
          <span class="text-fg-muted px-3 text-xs">
            {watchedLabel(watched)}
          </span>
        {/if}
      {/snippet}

      <div class="px-3 pb-2">
        <UptimeBars buckets={history} label={monitor.name} unit="hour" raised />
      </div>
    </Well>

    <div class="grid items-start gap-2 @4xl:grid-cols-2" aria-hidden="true">
      <SettingsCard
        title="Alerts"
        description="Where its down and recovery alerts go. New channels alert every monitor on this domain."
      >
        <SettingsCardItem>
          <p class="text-fg-muted">Telegram or any webhook.</p>

          {#snippet action()}
            <Button size="sm" tabindex={-1}>
              <PlusIcon class="size-4" />
              Add channel
            </Button>
          {/snippet}
        </SettingsCardItem>
      </SettingsCard>

      <SettingsCard title="Monitor" description="Its name, URL and badge.">
        {#snippet actions()}
          <span
            class="text-fg-muted -mr-1.5 flex size-7 items-center justify-center"
          >
            <TrashIcon class="size-4" />
          </span>
        {/snippet}

        <SettingsCardItem>
          {@render field('Name', monitor.name)}

          {#snippet action()}
            <Button size="sm" tabindex={-1}>Edit</Button>
          {/snippet}
        </SettingsCardItem>
        {#if monitor.url}
          <SettingsCardItem>
            {@render field('URL', monitor.url)}

            {#snippet action()}
              <Button size="sm" tabindex={-1}>Edit</Button>
            {/snippet}
          </SettingsCardItem>
        {/if}
        <SettingsCardItem>
          {@render field(
            'Badge',
            'Its uptime in a README, linked to your status page.',
            true,
          )}

          {#snippet action()}
            <Button size="sm" tabindex={-1}>
              <ShieldCheckIcon class="size-4" />
              Get badge
            </Button>
          {/snippet}
        </SettingsCardItem>
      </SettingsCard>
    </div>
  </div>
</div>

{#snippet field(label: string, value: string, muted = false)}
  <div class="flex min-w-0 items-center gap-3">
    <span class="text-fg-muted w-16 shrink-0">{label}</span>
    <span class={['truncate', { 'text-fg-muted': muted }]}>{value}</span>
  </div>
{/snippet}
