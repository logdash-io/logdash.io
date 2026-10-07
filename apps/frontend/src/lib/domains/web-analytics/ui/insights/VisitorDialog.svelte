<script lang="ts">
  import UserIcon from '$lib/domains/shared/icons/UserIcon.svelte';
  import Modal from '$lib/domains/shared/ui/Modal.svelte';
  import { CloseIcon } from '@logdash/hyper-ui/icons';
  import { Badge, Spinner } from '@logdash/hyper-ui/presentational';
  import { DateTime } from 'luxon';
  import { untrack } from 'svelte';
  import { WebAnalyticsVisitorState } from '../../application/web-analytics-dashboard.state.svelte';
  import { visitorName } from '../../domain/analytics-format';
  import type {
    WebAnalyticsVisitor,
    WebAnalyticsVisitorEvent,
  } from '../../domain/web-analytics';
  import BreakdownLabel from '../breakdown/BreakdownLabel.svelte';
  import VisitorAvatar from './VisitorAvatar.svelte';
  import VisitorTraits from './VisitorTraits.svelte';

  type Props = {
    clusterId: string;
    visitor: WebAnalyticsVisitor | null;
    onclose: () => void;
  };

  const { clusterId, visitor, onclose }: Props = $props();

  const details = new WebAnalyticsVisitorState(untrack(() => clusterId));
  const titleId = $props.id();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const sessions = $derived.by(
    (): { id: string; events: WebAnalyticsVisitorEvent[] }[] => {
      const grouped: { id: string; events: WebAnalyticsVisitorEvent[] }[] = [];
      for (const event of details.events) {
        const last = grouped.at(-1);
        if (last?.id === event.sessionId) last.events.push(event);
        else grouped.push({ id: event.sessionId, events: [event] });
      }
      return grouped;
    },
  );
  const profile = $derived(details.visitor ?? visitor);

  $effect(() => {
    const id = visitor?.id;
    if (!id) return;
    void untrack(() => details.load(id, tz));
  });

  function time(iso: string): string {
    return DateTime.fromISO(iso).toFormat('HH:mm:ss');
  }

  function day(iso: string): string {
    return DateTime.fromISO(iso).toFormat('EEE, d LLL yyyy');
  }
</script>

<Modal
  isOpen={visitor !== null}
  onClose={onclose}
  aria-labelledby={titleId}
  class="flex max-h-[min(44rem,88dvh)] w-full max-w-xl flex-col p-0"
>
  {#if profile}
    <header class="flex items-start gap-4 px-5 pt-5 pb-4">
      <VisitorAvatar id={profile.id} size="lg" />
      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 items-center gap-2">
          <h2 id={titleId} class="truncate text-base font-semibold">
            {visitorName(profile.id)}
          </h2>
          {#if profile.identified}
            <Badge variant="outline" size="sm" class="shrink-0 gap-1">
              <UserIcon class="size-3" />
              Signed in
            </Badge>
          {/if}
        </div>
        <VisitorTraits visitor={profile} />
      </div>
      <button
        type="button"
        class="hover:bg-surface-elevated-hover-bg hover:text-fg-default transition-ink flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-muted"
        aria-label="Close"
        onclick={onclose}
      >
        <CloseIcon class="size-4" />
      </button>
    </header>
    <dl class="grid grid-cols-3 edge-between-x edge-y text-sm">
      <div class="px-5 py-3">
        <dt class="text-fg-muted text-xs">First visit</dt>
        <dd class="mt-0.5">
          {DateTime.fromISO(profile.firstSeen).toFormat('d LLL yyyy')}
        </dd>
      </div>
      <div class="px-5 py-3">
        <dt class="text-fg-muted text-xs">Sessions</dt>
        <dd class="mt-0.5 tabular-nums">{profile.sessions}</dd>
      </div>
      <div class="px-5 py-3">
        <dt class="text-fg-muted text-xs">Pageviews</dt>
        <dd class="mt-0.5 tabular-nums">{profile.pageviews}</dd>
      </div>
    </dl>
  {/if}

  <div class="min-h-40 flex-1 overflow-y-auto px-5 py-4">
    {#if details.loading}
      <div class="flex h-40 items-center justify-center"><Spinner /></div>
    {:else if details.error}
      <p class="text-error py-6 text-center text-sm" role="alert">
        {details.error}
      </p>
    {:else}
      <ol class="flex flex-col gap-5">
        {#each sessions as session (session.id)}
          {@const first = session.events.at(-1)}
          <li>
            <div class="mb-2 flex items-center justify-between gap-3 text-xs">
              <span class="text-fg-tertiary font-medium">
                {first ? day(first.time) : ''}
              </span>
              {#if first}
                <span class="text-fg-muted flex min-w-0 items-center gap-1.5">
                  <BreakdownLabel dimension="referrers" name={first.source} />
                </span>
              {/if}
            </div>
            <ol class="ml-1 flex flex-col edge-l">
              {#each session.events as event, index (`${event.time}-${index}`)}
                <li
                  class="relative flex items-center gap-3 py-1.5 pl-4 text-sm"
                >
                  <span
                    class={[
                      'absolute top-1/2 -left-[4.5px] size-2 -translate-y-1/2 rounded-full',
                      event.name === 'pageview'
                        ? 'bg-current text-fg-faint'
                        : event.name === 'browser_error'
                          ? 'bg-error'
                          : 'bg-surface-inverse-bg',
                    ]}
                  ></span>
                  <span
                    class="text-fg-muted w-16 shrink-0 font-mono text-xs tabular-nums"
                  >
                    {time(event.time)}
                  </span>
                  {#if event.name === 'pageview'}
                    <span class="truncate">{event.path}</span>
                  {:else}
                    <span class="truncate font-mono text-[13px] font-medium">
                      {event.name}
                    </span>
                    <span class="text-fg-muted truncate text-xs">
                      on {event.path}
                    </span>
                  {/if}
                </li>
              {/each}
            </ol>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</Modal>
