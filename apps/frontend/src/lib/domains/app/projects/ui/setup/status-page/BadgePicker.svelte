<script lang="ts">
  import Highlight from 'svelte-highlight';
  import { markdown, xml } from 'svelte-highlight/languages';
  import { untrack } from 'svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { Button, Checkbox, Select } from '@logdash/hyper-ui/presentational';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { stripProtocol } from '$lib/domains/shared/utils/url.js';
  import type { Monitor } from '$lib/domains/app/projects/domain/monitoring/monitor.js';
  import {
    BADGE_PERIODS,
    BADGE_STYLES,
    getBadgeSnippet,
    getBadgeUrl,
    hasThemes,
    type BadgePeriod,
    type BadgeStyle,
  } from '$lib/domains/app/projects/domain/public-dashboards/badge.js';

  type Props = {
    dashboardId: string;
    statusPageUrl: string;
    monitors: Monitor[];
    initialMonitorId?: string;
  };

  const { dashboardId, statusPageUrl, monitors, initialMonitorId }: Props =
    $props();

  let selectedMonitorId = $state(
    untrack(() => initialMonitorId ?? monitors[0]?.id),
  );
  let style = $state<BadgeStyle>('classic');
  let period = $state<BadgePeriod>('30d');
  let matchTheme = $state(true);

  const monitor = $derived(
    monitors.find((candidate) => candidate.id === selectedMonitorId) ??
      monitors[0],
  );
  const monitorName = $derived(
    monitor.name || stripProtocol(monitor.url ?? ''),
  );
  const isThemed = $derived(hasThemes(style));
  const isCardStyle = $derived(style === 'card');
  const isHtmlSnippet = $derived(isThemed && matchTheme);
  const snippet = $derived(
    getBadgeSnippet({
      statusPageUrl,
      badgeKey: monitor.badgeKey,
      monitorName,
      style,
      period,
      matchTheme,
    }),
  );
  const lightPreviewUrl = $derived(
    getBadgeUrl(`/d/${dashboardId}`, monitor.badgeKey, style, period, 'light'),
  );
  const darkPreviewUrl = $derived(
    getBadgeUrl(`/d/${dashboardId}`, monitor.badgeKey, style, period, 'dark'),
  );

  async function onCopySnippet(): Promise<void> {
    await navigator.clipboard.writeText(snippet);
    toast.success('Badge snippet copied to clipboard');
  }
</script>

<div class="border-border-default flex flex-col gap-4 rounded-xl border p-4">
  {#if monitors.length > 1}
    <label class="flex flex-col gap-1.5 text-sm">
      <span class="text-neutral-400">Monitor</span>
      <Select size="sm" class="w-full" bind:value={selectedMonitorId}>
        {#each monitors as option (option.id)}
          <option value={option.id}>
            {option.name || stripProtocol(option.url ?? '')}
          </option>
        {/each}
      </Select>
    </label>
  {/if}

  <div class="flex flex-wrap items-center justify-between gap-2">
    <SegmentedControl
      options={BADGE_STYLES}
      value={style}
      onChange={(value: BadgeStyle) => (style = value)}
      size="xs"
    />

    {#if !isThemed}
      <SegmentedControl
        options={BADGE_PERIODS}
        value={period}
        onChange={(value: BadgePeriod) => (period = value)}
        size="xs"
      />
    {/if}
  </div>

  <div
    class={[
      'grid gap-2',
      {
        'sm:grid-cols-2': !isCardStyle,
      },
    ]}
  >
    <div
      class="flex min-h-20 items-center justify-center overflow-hidden rounded-lg bg-white p-4"
    >
      <img
        class="max-w-full"
        src={lightPreviewUrl}
        alt="{monitorName} badge on a light background"
      />
    </div>
    <div
      class="border-hairline flex min-h-20 items-center justify-center overflow-hidden rounded-lg border bg-neutral-950 p-4"
    >
      <img
        class="max-w-full"
        src={isThemed ? darkPreviewUrl : lightPreviewUrl}
        alt="{monitorName} badge on a dark background"
      />
    </div>
  </div>

  {#if isThemed}
    <label class="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox size="xs" variant="primary" bind:checked={matchTheme} />
      Switch to the dark version when the reader uses dark mode
    </label>
  {/if}

  <div class="flex flex-col gap-2">
    <p class="text-sm text-neutral-400">
      Paste this into your README. The badge links to your status page.
    </p>

    <div
      class="ld-card-base relative w-full overflow-hidden rounded-xl text-sm"
    >
      <Highlight
        class="code-snippet selection:bg-surface-100 break-all whitespace-pre-wrap [&>code]:pr-12!"
        code={snippet}
        language={isHtmlSnippet ? xml : markdown}
      />

      <Button
        size="sm"
        shape="square"
        class="bg-surface-100 absolute right-2 top-2 border-transparent"
        aria-label="Copy badge snippet"
        onclick={onCopySnippet}
      >
        <CopyIcon class="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
