<script lang="ts">
  import GlobeIcon from '$lib/domains/shared/icons/GlobeIcon.svelte';
  import {
    faviconUrl,
    isDarkGlyph,
  } from '$lib/domains/shared/utils/favicon.js';
  import { countryFlag, countryName } from '../../domain/analytics-format';
  import type { WebAnalyticsBreakdownName } from '../../domain/web-analytics';

  type Props = {
    dimension: WebAnalyticsBreakdownName;
    name: string;
  };

  const { dimension, name }: Props = $props();

  const favicon = $derived(faviconUrl(name));

  let failedFavicon = $state<string | null>(null);
  let darkFavicon = $state<string | null>(null);
</script>

{#if dimension === 'countries'}
  <span class="w-4 shrink-0 text-center leading-none" aria-hidden="true">
    {countryFlag(name)}
  </span>
  <span class="truncate">{countryName(name)}</span>
{:else if dimension === 'referrers' || dimension === 'hostnames'}
  {#if favicon && failedFavicon !== favicon}
    <img
      src={favicon}
      alt=""
      crossorigin="anonymous"
      class={[
        'size-4 shrink-0 rounded-sm object-contain',
        { 'bg-surface-inverse-bg p-px': darkFavicon === favicon },
      ]}
      loading="lazy"
      onload={(event) => {
        if (isDarkGlyph(event.currentTarget)) darkFavicon = favicon;
      }}
      onerror={() => (failedFavicon = favicon)}
    />
  {:else}
    <GlobeIcon class="size-4 shrink-0 text-fg-muted" />
  {/if}
  <span class="truncate">{name === 'Direct' ? 'Direct / None' : name}</span>
{:else}
  <span class="truncate">{name}</span>
{/if}
