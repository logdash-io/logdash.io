<script lang="ts">
  import { countryFlag, countryName } from '../../domain/analytics-format';
  import type { WebAnalyticsVisitor } from '../../domain/web-analytics';

  type Props = { visitor: WebAnalyticsVisitor };

  const { visitor }: Props = $props();

  const traits = $derived(
    [visitor.device, visitor.os, visitor.browser].filter(
      (trait) => trait && trait !== 'Other',
    ),
  );
</script>

<p class="text-fg-muted mt-0.5 truncate text-xs">
  {#if visitor.country}
    <span class="mr-2.5">
      <span class="mr-1" aria-hidden="true">
        {countryFlag(visitor.country)}
      </span>
      {countryName(visitor.country)}
    </span>
  {/if}
  {#each traits as trait (trait)}
    <span class="mr-2.5">{trait}</span>
  {/each}
</p>
