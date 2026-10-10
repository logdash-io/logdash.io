<script lang="ts">
  import { page } from '$app/state';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import { readHttpErrorMessage } from '$lib/domains/shared/http/http-error';
  import LoadingLine from '$lib/domains/shared/ui/components/LoadingLine.svelte';
  import SegmentedControl from '$lib/domains/shared/ui/components/SegmentedControl.svelte';
  import { SETTINGS_INPUT_CLASS } from '$lib/domains/shared/ui/components/settings-card';
  import { envConfig } from '$lib/domains/shared/utils/env-config';
  import CodeBlock from '$lib/landing/guides/blocks/CodeBlock.svelte';
  import { Button, Input } from '@logdash/hyper-ui/presentational';
  import { DateTime } from 'luxon';
  import { untrack } from 'svelte';
  import { WebAnalyticsSetupState } from '../application/web-analytics-setup.state.svelte';
  import {
    parseOrigin,
    websiteUrlFromName,
  } from '../domain/web-analytics-origin';
  import { webAnalyticsScriptTag } from '../domain/web-analytics-setup-prompt';
  import WebAnalyticsPromptForm from './WebAnalyticsPromptForm.svelte';

  type InstallTab = 'script' | 'proxy' | 'prompt';

  type Props = {
    clusterId: string;
    initialUrl?: string;
    services?: { id: string; name: string }[];
    connection?: WebAnalyticsSetupState;
    compact?: boolean;
  };

  const {
    clusterId,
    initialUrl = '',
    services,
    connection = new WebAnalyticsSetupState(),
    compact = false,
  }: Props = $props();

  const TABS: { value: InstallTab; label: string }[] = [
    { value: 'prompt', label: 'AI prompt' },
    { value: 'script', label: 'Script' },
    { value: 'proxy', label: 'Proxy' },
  ];

  const id = $props.id();
  const apiBase = envConfig.apiBaseUrl.replace(/\/$/, '');

  let tab = $state<InstallTab>('prompt');
  let websiteUrl = $derived(
    initialUrl || websiteUrlFromName(clustersState.get(clusterId)?.name),
  );
  let starting = $state(false);
  let startError = $state<string | null>(null);

  const serviceList = $derived(
    services ?? clustersState.get(clusterId)?.projects ?? [],
  );
  const scriptTag = $derived(
    webAnalyticsScriptTag({
      src: `${page.url.origin}/sdk/web.js`,
      siteId: connection.site?.id ?? '',
      endpoint: `${apiBase}/web_events`,
    }),
  );
  const proxyTag = $derived(
    webAnalyticsScriptTag({
      src: '/_ld/script.js',
      siteId: connection.site?.id ?? '',
      endpoint: '/_ld/events',
    }),
  );
  const lastVisit = $derived(
    connection.status?.lastWebEventAt
      ? DateTime.min(
          DateTime.fromISO(connection.status.lastWebEventAt),
          DateTime.now(),
        ).toRelative({ locale: 'en' })
      : null,
  );

  $effect(() => {
    const cluster = clusterId;
    void untrack(() => connection.load(cluster));
  });

  $effect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) void connection.refreshStatus();
    }, 5000);
    return () => clearInterval(timer);
  });

  async function onStart(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const origin = parseOrigin(websiteUrl);
    if (!origin) {
      startError =
        'Enter an HTTPS address like https://example.com. HTTP works on localhost only.';
      return;
    }
    starting = true;
    startError = null;
    try {
      await connection.saveOrigins([origin]);
    } catch (error) {
      startError =
        readHttpErrorMessage(error) ?? 'Could not start tracking. Try again.';
    } finally {
      starting = false;
    }
  }
</script>

<div class={['flex flex-col', compact ? 'gap-4' : 'gap-5']}>
  {#if connection.loading}
    <LoadingLine label="Loading tracking setup" />
  {:else if connection.error}
    <div class="flex flex-wrap items-center gap-3">
      <p class="text-sm text-error" role="alert">{connection.error}</p>
      <Button size="sm" onclick={() => connection.load(clusterId)}>
        Try again
      </Button>
    </div>
  {:else if !connection.site}
    {@render start()}
  {:else}
    {@render install()}
  {/if}
</div>

{#snippet start()}
  <form onsubmit={onStart} class="flex flex-col gap-2" novalidate>
    <label for="{id}-url" class="text-sm text-fg-tertiary">Website URL</label>
    <div class="flex gap-2">
      <Input
        id="{id}-url"
        size="sm"
        bind:value={websiteUrl}
        type="url"
        inputmode="url"
        autocomplete="url"
        maxlength={255}
        placeholder="https://your-website.com"
        class={['min-w-0 flex-1', SETTINGS_INPUT_CLASS]}
        error={Boolean(startError)}
        aria-describedby={startError ? `${id}-start-error` : undefined}
        oninput={() => (startError = null)}
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        loading={starting}
        disabled={!websiteUrl.trim()}
      >
        Start tracking
      </Button>
    </div>
    {#if startError}
      <p id="{id}-start-error" class="text-sm text-error" role="alert">
        {startError}
      </p>
    {/if}
  </form>
{/snippet}

{#snippet install()}
  <SegmentedControl
    options={TABS}
    value={tab}
    onChange={(next: InstallTab) => (tab = next)}
    label="Install method"
  />

  <div class="flex min-w-0 flex-col gap-3 text-sm text-fg-tertiary">
    {#if tab === 'script'}
      <p>
        Paste this snippet in the <code
          class="font-mono whitespace-nowrap text-fg-default"
        >
          &lt;head&gt;
        </code>
        of your website.
      </p>
      <div class="rounded-xl edge bg-surface-50-bg">
        <CodeBlock code={scriptTag} language="svelte" />
      </div>
      {@render identify()}
      <p class="text-xs text-fg-muted">
        Ad blockers can block the default address.
        <button
          type="button"
          class="cursor-pointer text-fg-tertiary underline underline-offset-2 transition-ink hover:text-fg-default"
          onclick={() => (tab = 'proxy')}
        >
          Serve it from your own domain
        </button>
        instead.
      </p>
    {:else if tab === 'proxy'}
      <p>
        Serve the script and events from your own domain so ad blockers do not
        drop visits. Add two routes that forward to Logdash:
      </p>
      <ul
        class="edge-between rounded-xl edge bg-surface-50-bg font-mono text-xs"
      >
        {@render route(
          'GET',
          '/_ld/script.js',
          `${page.url.origin}/sdk/web.js`,
        )}
        {@render route('POST', '/_ld/events', `${apiBase}/web_events`)}
      </ul>
      <p>On the events route:</p>
      <ul class="flex list-disc flex-col gap-1 pl-5 marker:text-fg-faint">
        <li>
          Forward the browser's
          <code class="font-mono whitespace-nowrap text-fg-default">
            Origin
          </code>
          and
          <code class="font-mono whitespace-nowrap text-fg-default">
            User-Agent
          </code>
          headers. Without an Origin the API answers 403.
        </li>
        <li>
          Set
          <code class="font-mono whitespace-nowrap text-fg-default">
            x-logdash-client-ip
          </code>
          to the visitor's IP address so visitors are counted apart.
        </li>
        <li>
          Never forward cookies, authorization headers or ingest keys, on either
          route.
        </li>
      </ul>
      <p>Then load the script from your domain:</p>
      <div class="rounded-xl edge bg-surface-50-bg">
        <CodeBlock code={proxyTag} language="svelte" />
      </div>
      {@render identify()}
      <p class="text-xs text-fg-muted">
        Prefer not to write the routes yourself?
        <button
          type="button"
          class="cursor-pointer text-fg-tertiary underline underline-offset-2 transition-ink hover:text-fg-default"
          onclick={() => (tab = 'prompt')}
        >
          Use the AI prompt
        </button>
      </p>
    {:else}
      <p>
        {serviceList.length
          ? 'One prompt sets up the proxy, backend logging and metrics in your codebase.'
          : 'One prompt sets up the proxy and the tracking script in your codebase.'}
      </p>
      <WebAnalyticsPromptForm {connection} services={serviceList} />
    {/if}
  </div>

  <div class={['flex flex-col gap-2 edge-t', compact ? 'pt-4' : 'pt-5']}>
    <div aria-live="polite">
      {@render trackingStatus()}
    </div>
    {#if !compact}
      <p class="text-xs leading-relaxed text-fg-muted">
        No cookies or browser storage: visitors are counted with a pseudonymous
        hash that changes every day, and IP addresses are not stored.
      </p>
    {/if}
  </div>
{/snippet}

{#snippet identify()}
  <p>
    For retention, call
    <code class="font-mono whitespace-nowrap text-fg-default">
      window.logdash?.identify(user.id)
    </code>
    on each page load once the user is signed in, and
    <code class="font-mono whitespace-nowrap text-fg-default">
      identify(null)
    </code>
    on sign-out. If
    <code class="font-mono whitespace-nowrap text-fg-default">
      window.logdash
    </code>
    is not defined yet, call it from the script's
    <code class="font-mono whitespace-nowrap text-fg-default">load</code>
    event.
  </p>
{/snippet}

{#snippet trackingStatus()}
  <span
    class="inline-flex h-7 items-center gap-2 rounded-full edge bg-surface-50-bg px-3 text-xs"
  >
    {#if lastVisit}
      <span class="size-1.5 shrink-0 rounded-full bg-success"></span>
      <span class="text-fg-default">Receiving visits</span>
      <span class="text-fg-muted">· last {lastVisit}</span>
    {:else}
      <span class="size-1.5 shrink-0 animate-pulse rounded-full bg-idle"></span>
      <span class="text-fg-tertiary">Waiting for the first visit</span>
    {/if}
  </span>
{/snippet}

{#snippet route(method: string, path: string, target: string)}
  <li class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-3.5 py-2.5">
    <span class="w-9 shrink-0 text-fg-muted">{method}</span>
    <span class="w-28 shrink-0 text-fg-default">{path}</span>
    <span class="text-fg-muted" aria-hidden="true">→</span>
    <span class="sr-only">forwards to</span>
    <span class="min-w-0 break-all text-fg-tertiary">{target}</span>
  </li>
{/snippet}
