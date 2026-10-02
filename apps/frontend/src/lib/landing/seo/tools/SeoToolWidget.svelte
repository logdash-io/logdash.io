<script lang="ts">
  import HeroUrlForm from '$lib/landing/hero/HeroUrlForm.svelte';
  import type { SeoTool } from '../seo-page';
  import BadgeGenerator from './BadgeGenerator.svelte';
  import CronExpressionTool from './CronExpressionTool.svelte';
  import DowntimeCostCalculator from './DowntimeCostCalculator.svelte';
  import SlaCalculator from './SlaCalculator.svelte';
  import UptimeCalculator from './UptimeCalculator.svelte';

  type Props = {
    tool: SeoTool;
  };

  const { tool }: Props = $props();
</script>

<div class="mt-8">
  {#if tool.kind === 'site-check'}
    <HeroUrlForm source="seo" />
  {:else if tool.kind === 'uptime-calculator'}
    <UptimeCalculator percent={tool.percent} />
  {:else if tool.kind === 'sla-calculator'}
    <SlaCalculator />
  {:else if tool.kind === 'downtime-cost'}
    <DowntimeCostCalculator />
  {:else if tool.kind === 'cron-expression'}
    <CronExpressionTool dialect={tool.dialect} />
  {:else if tool.kind === 'badge-generator'}
    <BadgeGenerator />
  {/if}
</div>
