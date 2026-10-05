<script lang="ts">
  import { probeUrl } from '$lib/domains/app/projects/application/url-probe.js';
  import {
    urlHint,
    withPath,
    type UrlProbe,
  } from '$lib/domains/app/projects/domain/monitoring/url-hint.js';
  import { createLogger } from '$lib/domains/shared/logger';
  import { autoFocus } from '$lib/domains/shared/ui/actions/use-autofocus.svelte.js';
  import {
    isValidUrl,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url.js';
  import {
    Button,
    Input,
    Label,
    Spinner,
  } from '@logdash/hyper-ui/presentational';
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import { fromAction } from 'svelte/attachments';
  import type { ClassValue } from 'svelte/elements';

  type Props = {
    id: string;
    projectId: string;
    value: string;
    autofocus?: boolean;
    size?: 'sm' | 'md';
    inputClass?: ClassValue;
  };

  let {
    id,
    projectId,
    value = $bindable(),
    autofocus = false,
    size = 'md',
    inputClass,
  }: Props = $props();

  const logger = createLogger('monitor-url-field', false);

  const PROBE_DELAY_MS = 600;
  const SPINNER_DELAY_MS = 400;
  const MAX_URL_LENGTH = 1024;

  let probed = $state<{ url: string; probe: UrlProbe } | null>(null);
  let slowProbeUrl = $state<string | null>(null);

  const probeTarget = $derived(
    isValidUrl(value.trim()) ? tryPrependProtocol(value.trim()) : null,
  );
  const probe = $derived(probed?.url === probeTarget ? probed.probe : null);
  const hint = $derived(urlHint(value, probe));
  const isProbing = $derived(
    slowProbeUrl !== null && slowProbeUrl === probeTarget,
  );

  $effect(() => {
    const url = probeTarget;

    if (!url) {
      return;
    }

    const timer = setTimeout(() => void runProbe(url), PROBE_DELAY_MS);

    return () => clearTimeout(timer);
  });

  async function runProbe(url: string): Promise<void> {
    const spinnerTimer = setTimeout(
      () => (slowProbeUrl = url),
      SPINNER_DELAY_MS,
    );

    try {
      const result = await probeUrl(projectId, url);

      if (url === probeTarget) {
        probed = { url, probe: result };
      }
    } catch (error) {
      logger.debug('URL probe failed', error);
    } finally {
      clearTimeout(spinnerTimer);

      if (slowProbeUrl === url) {
        slowProbeUrl = null;
      }
    }
  }

  function onUseHealthPath(path: string): void {
    value = withPath(value, path);
    document.getElementById(id)?.focus();
  }
</script>

<div class="flex flex-col gap-2">
  <Label class={size === 'sm' ? 'text-xs text-fg-muted' : 'text-sm'} for={id}>
    URL to monitor
  </Label>

  <div class="relative">
    <Input
      {id}
      bind:value
      type="text"
      inputmode="url"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      maxlength={MAX_URL_LENGTH}
      {size}
      class={['w-full pr-9', inputClass]}
      placeholder="https://example.com/health"
      {@attach fromAction(autoFocus, () => ({
        delay: 100,
        enabled: autofocus,
      }))}
    />

    {#if isProbing}
      <Spinner
        size="xs"
        class="text-fg-muted absolute top-1/2 right-3 -translate-y-1/2"
        aria-label="Checking the URL"
      />
    {/if}
  </div>

  {#if hint.kind === 'catch-all'}
    <div class="text-warning flex gap-2 text-xs" role="status">
      <DangerIcon class="mt-px size-3.5 shrink-0" />
      <div class="flex flex-col gap-2">
        <p class="text-pretty">
          This host answers every path with the same page, so a check here only
          proves the host is up.
        </p>
        {#if hint.healthPaths.length > 0}
          {@render healthPathChips(
            'Use a health check instead:',
            hint.healthPaths,
          )}
        {:else}
          <p class="text-fg-tertiary text-pretty">
            Point it at a health endpoint like /health if your app has one.
          </p>
        {/if}
      </div>
    </div>
  {:else if hint.kind === 'health-paths'}
    {@render healthPathChips('Found a health check:', hint.healthPaths)}
  {:else if hint.kind === 'suggest-health'}
    <p class="text-fg-muted text-xs text-pretty">
      A health endpoint like /health, /api/health or /up catches more failures
      than the home page.
    </p>
  {/if}
</div>

{#snippet healthPathChips(label: string, paths: string[])}
  <div class="text-fg-tertiary flex flex-wrap items-center gap-1.5 text-xs">
    <span>{label}</span>
    {#each paths as path (path)}
      <Button
        size="xs"
        class="font-mono"
        aria-label={`Use ${path}`}
        onclick={() => onUseHealthPath(path)}
      >
        {path}
      </Button>
    {/each}
  </div>
{/snippet}
