<script lang="ts">
  import { Button, Spinner } from '@logdash/hyper-ui/presentational';
  import { DateTime } from 'luxon';
  import { untrack } from 'svelte';
  import { WebAnalyticsVisitorsState } from '../../application/web-analytics-dashboard.state.svelte';
  import { relativeDay, visitorName } from '../../domain/analytics-format';
  import type {
    WebAnalyticsRange,
    WebAnalyticsVisitor,
  } from '../../domain/web-analytics';
  import BreakdownLabel from '../breakdown/BreakdownLabel.svelte';
  import VisitorAvatar from './VisitorAvatar.svelte';
  import VisitorDialog from './VisitorDialog.svelte';
  import VisitorTraits from './VisitorTraits.svelte';

  type Props = {
    clusterId: string;
    range: WebAnalyticsRange;
    limit?: number;
  };

  const { clusterId, range, limit }: Props = $props();

  const visitors = new WebAnalyticsVisitorsState(untrack(() => clusterId));
  let opened = $state<WebAnalyticsVisitor | null>(null);

  const visible = $derived(
    limit ? visitors.visitors.slice(0, limit) : visitors.visitors,
  );

  const recentDays = $derived(
    Array.from({ length: 7 }, (_, index) =>
      DateTime.fromJSDate(range.to)
        .minus({ milliseconds: 1, days: 6 - index })
        .toISODate(),
    ),
  );

  $effect(() => {
    const current = range;
    void untrack(() => visitors.load(current));
  });

  function onMore(): void {
    void visitors.load(range, true);
  }

  function onOpen(visitor: WebAnalyticsVisitor): void {
    opened = visitor;
  }

  function onClose(): void {
    opened = null;
  }
</script>

{#if visitors.loading && !visitors.visitors.length}
  <div class="flex flex-1 items-center justify-center py-16"><Spinner /></div>
{:else if visitors.error}
  <p class="text-error py-10 text-center text-sm" role="alert">
    {visitors.error}
  </p>
{:else if !visitors.visitors.length}
  <p
    class="text-fg-muted flex flex-1 items-center justify-center py-16 text-sm"
  >
    No visitors in this period
  </p>
{:else}
  <div class="@container">
    <table class="w-full table-fixed text-left text-sm">
      <thead class="text-fg-muted text-xs">
        <tr>
          <th scope="col" class="h-6 px-3 font-normal">Visitor</th>
          <th
            scope="col"
            class="hidden h-6 w-1/3 px-3 font-normal @xl:table-cell"
          >
            Source
          </th>
          <th scope="col" class="h-6 w-40 px-3 font-normal">Last seen</th>
        </tr>
      </thead>
      <tbody>
        {#each visible as visitor (visitor.id)}
          <tr
            class={[
              'group relative',
              limit
                ? 'hover:bg-surface-25-hover-bg'
                : 'hover:bg-surface-elevated-hover-bg',
            ]}
          >
            <td class="rounded-l-lg px-3 py-2">
              <div class="flex min-w-0 items-center gap-3">
                <VisitorAvatar id={visitor.id} />
                <div class="min-w-0">
                  <button
                    type="button"
                    class="focus-visible:outline-brand block max-w-full cursor-pointer truncate text-left font-medium outline-none after:absolute after:inset-0 group-hover:underline focus-visible:after:rounded-lg focus-visible:after:outline-2 focus-visible:after:-outline-offset-2"
                    onclick={() => onOpen(visitor)}
                  >
                    {visitorName(visitor.id)}
                  </button>
                  <VisitorTraits {visitor} />
                </div>
              </div>
            </td>
            <td class="hidden px-3 py-2 @xl:table-cell">
              <span class="flex min-w-0 items-center gap-2">
                <BreakdownLabel dimension="referrers" name={visitor.source} />
              </span>
            </td>
            <td class="rounded-r-lg px-3 py-2">
              <p class="whitespace-nowrap">{relativeDay(visitor.lastSeen)}</p>
              <p class="mt-1.5 flex gap-1" aria-label="Active days this week">
                {#each recentDays as day (day)}
                  <span
                    class={[
                      'size-1.5 rounded-full',
                      visitor.activeDays.includes(day ?? '')
                        ? 'bg-surface-inverse-bg'
                        : 'bg-current text-fg-disabled',
                    ]}
                    title={day}
                  ></span>
                {/each}
              </p>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if !limit && visitors.visitors.length < visitors.total}
    <div class="flex justify-center pt-3">
      <Button size="sm" loading={visitors.loading} onclick={onMore}>
        Show more ({visitors.total - visitors.visitors.length} left)
      </Button>
    </div>
  {/if}
{/if}

<VisitorDialog {clusterId} visitor={opened} onclose={onClose} />
