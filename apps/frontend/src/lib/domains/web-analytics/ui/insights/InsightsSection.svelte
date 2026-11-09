<script lang="ts">
  import { resolve } from '$app/paths';
  import PlusIcon from '$lib/domains/shared/icons/PlusIcon.svelte';
  import { confirmDialog } from '$lib/domains/shared/ui/confirm/confirm.state.svelte';
  import EmptyState from '$lib/domains/shared/ui/components/EmptyState.svelte';
  import { TOOLBAR_CONTROL } from '$lib/domains/shared/ui/components/toolbar';
  import Well from '$lib/domains/shared/ui/components/Well.svelte';
  import { onMount, untrack } from 'svelte';
  import { WebAnalyticsInsightsState } from '../../application/web-analytics-dashboard.state.svelte';
  import type {
    WebAnalyticsInsight,
    WebAnalyticsInsightConfig,
  } from '../../domain/web-analytics';
  import InsightCard from './InsightCard.svelte';
  import InsightEditor from './InsightEditor.svelte';

  type Props = {
    clusterId: string;
    revision: number;
  };

  const { clusterId, revision }: Props = $props();

  const insights = new WebAnalyticsInsightsState(untrack(() => clusterId));
  const titleId = $props.id();

  let editing = $state<WebAnalyticsInsight | null>(null);
  let editorOpen = $state(false);

  onMount(() => {
    void insights.load();
  });

  function onAdd(): void {
    editing = null;
    editorOpen = true;
  }

  function onEdit(insight: WebAnalyticsInsight): void {
    editing = insight;
    editorOpen = true;
  }

  function onClose(): void {
    editorOpen = false;
  }

  async function onSave(
    config: WebAnalyticsInsightConfig,
    id: string | null,
  ): Promise<void> {
    await insights.save(config, id);
  }

  async function onMove(
    insight: WebAnalyticsInsight,
    offset: number,
  ): Promise<void> {
    await insights.move(insight.id, offset);
  }

  async function onRemove(insight: WebAnalyticsInsight): Promise<void> {
    const confirmed = await confirmDialog.ask({
      title: 'Remove insight',
      description: `${insight.title} leaves this dashboard for everyone on this domain.`,
      confirmLabel: 'Remove insight',
    });
    if (confirmed) await insights.remove(insight.id);
  }
</script>

<section
  class="@container/insights flex flex-col gap-2"
  aria-labelledby={titleId}
>
  <header class="flex h-9 items-center justify-between gap-3 pr-1 pl-5">
    <h2 id={titleId} class="truncate text-[13px] font-medium">
      Insights
      <span class="text-fg-muted font-normal">
        Saved for everyone on this domain
      </span>
    </h2>
    {#if insights.insights?.length}
      <button type="button" class={TOOLBAR_CONTROL} onclick={onAdd}>
        <PlusIcon class="size-3.5" />
        Add insight
      </button>
    {/if}
  </header>

  {#if insights.error}
    <p class="text-error px-5 text-sm" role="alert">{insights.error}</p>
  {/if}

  {#if insights.insights === null}
    {#if !insights.error}
      <div class="bg-surface-25-bg h-72 rounded-2xl" aria-hidden="true"></div>
    {/if}
  {:else if !insights.insights.length}
    <Well label="No insights yet">
      <EmptyState
        centered
        title="Turn your events into answers"
        description="Save funnels, trends, histograms and cohort tables of your events. They stay here for everyone on this domain, and your coding agent can build them for you too."
      >
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button type="button" class={TOOLBAR_CONTROL} onclick={onAdd}>
            <PlusIcon class="size-3.5" />
            Add insight
          </button>
          <a
            href={resolve('/docs/mcp')}
            class={[TOOLBAR_CONTROL, 'text-fg-tertiary']}
          >
            Connect your agent
          </a>
        </div>
      </EmptyState>
    </Well>
  {:else}
    <div class="grid gap-2 @4xl/insights:grid-cols-2">
      {#each insights.insights as insight, index (insight.id)}
        <InsightCard
          {clusterId}
          {insight}
          {revision}
          first={index === 0}
          last={index === insights.insights.length - 1}
          onedit={onEdit}
          onmove={onMove}
          onremove={onRemove}
        />
      {/each}
    </div>
  {/if}
</section>

<InsightEditor
  {clusterId}
  isOpen={editorOpen}
  insight={editing}
  onclose={onClose}
  onsave={onSave}
/>
