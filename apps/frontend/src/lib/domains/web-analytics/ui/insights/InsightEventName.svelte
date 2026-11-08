<script lang="ts">
  import type { WebAnalyticsInsightFilter } from '../../domain/web-analytics';
  import { filterLabel } from '../../domain/web-analytics-insight';

  type Props = {
    name: string;
    prefix: string;
    filters: WebAnalyticsInsightFilter[];
    wrap?: boolean;
  };

  const { name, prefix, filters, wrap = false }: Props = $props();

  const head = $derived(breakable(prefix));
  const tail = $derived(breakable(name.slice(prefix.length)));

  function breakable(text: string): string {
    return wrap ? text.replaceAll('_', '_\u200b') : text;
  }
</script>

<span class="flex min-w-0 flex-col" title={name}>
  <span class={['block min-w-0', { truncate: !wrap }]}>
    {#if head}<span class="text-fg-muted">{head}</span>{/if}{tail}
  </span>
  {#if filters.length}
    <span class={['text-fg-muted block text-xs', { truncate: !wrap }]}>
      {filters.map(filterLabel).join(', ')}
    </span>
  {/if}
</span>
