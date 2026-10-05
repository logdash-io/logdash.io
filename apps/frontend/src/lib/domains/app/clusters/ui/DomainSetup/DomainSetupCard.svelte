<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { clustersState } from '$lib/domains/app/clusters/application/clusters.state.svelte.js';
  import {
    addMonitoredAddress,
    finishDomainSetup,
  } from '$lib/domains/app/clusters/application/domain-setup';
  import {
    monitorLine,
    newSuggestions,
  } from '$lib/domains/app/clusters/domain/monitor-line';
  import { monitoringState } from '$lib/domains/app/projects/application/monitoring.state.svelte.js';
  import { monitoringService } from '$lib/domains/app/projects/infrastructure/monitoring.service';
  import OnboardingSurvey from '$lib/domains/onboarding/ui/OnboardingSurvey.svelte';
  import { readHttpErrorStatus } from '$lib/domains/shared/http/http-error';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import {
    SETTINGS_PAGE_CLASS,
    SETTINGS_PANEL_CLASS,
    SettingsCardHeader,
  } from '$lib/domains/shared/ui/components/settings-card';
  import { upgradeState } from '$lib/domains/shared/upgrade/upgrade.state.svelte.js';
  import { userState } from '$lib/domains/shared/user/application/user.state.svelte.js';
  import { displayUrl, isValidUrl } from '$lib/domains/shared/utils/url';
  import { Button, Input } from '@logdash/hyper-ui/presentational';
  import { posthog } from 'posthog-js';
  import { untrack } from 'svelte';
  import { match } from 'ts-pattern';

  type Props = {
    clusterId: string;
  };

  const PING_POLL_MS = 2_000;
  const FIRST_PING_KEY = 'logdash_first_ping_captured';

  const { clusterId }: Props = $props();
  const id = $props.id();

  let suggestions = $state<string[]>([]);
  let address = $state('');
  let adding = $state<string | null>(null);
  let error = $state<string | null>(null);

  const projectIds = $derived(
    (clustersState.get(clusterId)?.projects ?? []).map(({ id }) => id),
  );
  const monitors = $derived(
    monitoringState.monitors
      .filter(({ projectId }) => projectIds.includes(projectId))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
  const rows = $derived(
    monitors.map((monitor) => ({
      monitor,
      line: monitorLine(
        monitoringState.monitoringPings(monitor.id).at(-1),
        monitor,
      ),
    })),
  );
  const firstPingLanded = $derived(
    rows.some(({ line }) => line.tone !== 'idle'),
  );
  const offered = $derived(
    newSuggestions(
      suggestions,
      monitors.flatMap(({ url }) => (url ? [url] : [])),
    ),
  );
  const email = $derived(userState.isAnonymous ? null : userState.user?.email);
  const surveyOpen = $derived(
    firstPingLanded &&
      !userState.isAnonymous &&
      userState.user?.onboardingCompletedAt === null,
  );

  $effect(() => {
    const syncedClusterId = clusterId;
    void untrack(() => monitoringState.sync(syncedClusterId));

    return () => monitoringState.unsync();
  });

  $effect(() => {
    const waiting = monitors.filter(
      ({ id }) => monitoringState.monitoringPings(id).length === 0,
    );

    if (waiting.length === 0) {
      return;
    }

    const load = (): void => {
      for (const monitor of waiting) {
        void monitoringState.loadMonitorPings(monitor.projectId, monitor.id, 1);
      }
    };

    load();
    const timer = setInterval(load, PING_POLL_MS);

    return () => clearInterval(timer);
  });

  $effect(() => {
    if (!firstPingLanded) {
      return;
    }

    untrack(captureFirstPing);
  });

  $effect(() => {
    const url = monitors[0]?.url;

    if (!url) {
      return;
    }

    untrack(() => void loadSuggestions(url));
  });

  function captureFirstPing(): void {
    const captured = (localStorage.getItem(FIRST_PING_KEY) ?? '').split(',');

    if (captured.includes(clusterId)) {
      return;
    }

    localStorage.setItem(FIRST_PING_KEY, [...captured, clusterId].join(','));
    posthog.capture('first_ping_received', { clusterId });
  }

  async function loadSuggestions(url: string): Promise<void> {
    try {
      suggestions = (await monitoringService.suggestUrls(clusterId, url)).urls;
    } catch {
      suggestions = [];
    }
  }

  async function onAdd(url: string): Promise<void> {
    if (!isValidUrl(url.trim())) {
      error = 'Enter an address like api.example.com.';
      return;
    }

    adding = url;
    error = null;

    try {
      await addMonitoredAddress(clusterId, url);
      address = '';
      await invalidateAll();
    } catch (cause) {
      error = readError(cause);
    } finally {
      adding = null;
    }
  }

  function onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    void onAdd(address);
  }

  function onDone(): void {
    finishDomainSetup(clusterId);
    void invalidateAll();
  }

  function readError(cause: unknown): string | null {
    return match(readHttpErrorStatus(cause))
      .with(409, () => {
        upgradeState.openModal('project-limit');
        return null;
      })
      .with(400, () => 'Enter a public address, like api.example.com.')
      .otherwise(() => 'Could not add the address. Try again.');
  }
</script>

<section
  class={[SETTINGS_PAGE_CLASS, 'gap-3! edge-b']}
  aria-labelledby="monitoring"
>
  <SettingsCardHeader
    title="Monitoring"
    description="We check these addresses around the clock."
  />

  <div class={['flex min-w-0 flex-col gap-5', SETTINGS_PANEL_CLASS]}>
    <ul class="flex flex-col gap-2.5" aria-live="polite">
      {#each rows as { monitor, line } (monitor.id)}
        <li class="flex min-w-0 items-center gap-2.5 text-sm">
          <span
            class={[
              'size-2 shrink-0 rounded-full',
              {
                'bg-success': line.tone === 'up',
                'bg-error': line.tone === 'down',
                'bg-idle motion-safe:animate-pulse': line.tone === 'idle',
              },
            ]}
          ></span>
          <span class="min-w-0 truncate text-fg-default">
            {displayUrl(monitor.url ?? monitor.name)}
          </span>
          <span class="ml-auto shrink-0 text-fg-tertiary tabular-nums">
            {line.text}
          </span>
        </li>
      {/each}
    </ul>

    {#if email}
      <p class="text-[13px] text-fg-muted">
        Alerts go to <span class="text-fg-secondary">{email}</span>
      </p>
    {/if}

    <form
      onsubmit={onSubmit}
      class="flex flex-col gap-2 edge-t pt-4"
      novalidate
    >
      <label for="{id}-address" class="text-sm text-fg-tertiary">
        Monitor more
      </label>
      {#if offered.length}
        <div class="flex flex-wrap gap-1.5">
          {#each offered as url (url)}
            <Button
              size="xs"
              loading={adding === url}
              disabled={adding !== null}
              onclick={() => onAdd(url)}
            >
              <PlusIcon class="size-3" />
              {displayUrl(url)}
            </Button>
          {/each}
        </div>
      {/if}
      <div class="flex gap-2">
        <Input
          id="{id}-address"
          bind:value={address}
          type="url"
          inputmode="url"
          maxlength={1024}
          placeholder="api.example.com"
          class="min-w-0 flex-1"
          error={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          oninput={() => (error = null)}
        />
        <Button
          type="submit"
          loading={adding === address && address !== ''}
          disabled={!address.trim() || adding !== null}
        >
          Add
        </Button>
      </div>
      {#if error}
        <p id="{id}-error" class="text-sm text-error" role="alert">{error}</p>
      {/if}
    </form>

    {#if surveyOpen}
      <div class="edge-t pt-4">
        <OnboardingSurvey />
      </div>
    {/if}

    <div class="flex justify-end">
      <Button variant="primary" size="sm" onclick={onDone}>Done</Button>
    </div>
  </div>
</section>
