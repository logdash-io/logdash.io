<script lang="ts">
  import {
    BADGE_PERIODS,
    BADGE_STYLES,
    hasThemes,
    type BadgePeriod,
    type BadgeStyle,
  } from '$lib/domains/app/projects/domain/public-dashboards/badge';
  import {
    badgeSnippets,
    badgeUrl,
    isBadgeKey,
    readStatusPage,
    type BadgeTheme,
  } from './badge';
  import ToolChoice from './ToolChoice.svelte';
  import ToolField from './ToolField.svelte';
  import ToolPanel from './ToolPanel.svelte';
  import ToolSnippet from './ToolSnippet.svelte';

  const THEMES: { value: BadgeTheme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  const errorId = $props.id();

  let statusPage = $state('status.logdash.io');
  let badgeKey = $state('AOUzMYzobxKq');
  let style = $state<BadgeStyle>('classic');
  let period = $state<BadgePeriod>('30d');
  let theme = $state<BadgeTheme>('light');
  let failedSrc = $state<string | null>(null);

  const target = $derived(readStatusPage(statusPage));
  const keyValid = $derived(isBadgeKey(badgeKey));
  const themed = $derived(hasThemes(style));
  const src = $derived(
    target && keyValid
      ? badgeUrl(target, badgeKey, style, period, theme)
      : null,
  );
  const snippets = $derived(
    target && src ? badgeSnippets(target, src, style) : null,
  );
</script>

<ToolPanel label="Uptime badge generator">
  {#snippet controls()}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ToolField
        label="Status page ID or custom domain"
        bind:value={statusPage}
        invalid={target === null}
        describedby={target === null ? errorId : undefined}
      />
      <ToolField
        label="Monitor key"
        bind:value={badgeKey}
        hint="monitors[].id in the status page API"
        mono
        invalid={!keyValid}
        describedby={keyValid ? undefined : errorId}
      />
    </div>
    <div class="flex flex-wrap gap-x-6 gap-y-4">
      <ToolChoice legend="Style" options={BADGE_STYLES} bind:value={style} />
      {#if themed}
        <ToolChoice legend="Theme" options={THEMES} bind:value={theme} />
      {:else}
        <ToolChoice
          legend="Period"
          options={BADGE_PERIODS}
          bind:value={period}
        />
      {/if}
    </div>
  {/snippet}

  {#if !src || !snippets}
    <p id={errorId} role="status" class="text-error text-sm">
      {target === null
        ? 'Enter the 24-character status page ID from its logdash.io/d/ link, or its custom domain, like status.example.com.'
        : 'A monitor key is letters, digits, - and _ only.'}
    </p>
  {:else}
    <div
      class={[
        'flex min-h-24 items-center justify-center overflow-hidden rounded-lg p-4',
        themed && theme === 'light' ? 'bg-white' : 'border-hairline border',
      ]}
    >
      {#if failedSrc === src}
        <p role="status" class="text-neutral-500 text-sm">
          No badge for this status page and monitor key. The page must be
          published and the monitor on it.
        </p>
      {:else}
        <img
          {src}
          alt="Badge preview"
          class="max-w-full"
          onerror={() => (failedSrc = src)}
        />
      {/if}
    </div>
    <ToolSnippet
      title="Markdown"
      language="markdown"
      code={snippets.markdown}
    />
    <ToolSnippet title="HTML" language="html" code={snippets.html} />
  {/if}
</ToolPanel>
