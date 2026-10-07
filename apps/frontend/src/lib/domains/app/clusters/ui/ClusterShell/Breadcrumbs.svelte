<script lang="ts" module>
  export type Crumb = {
    label: string;
    path?: '/app/domains' | `/app/domains/${string}`;
  };
</script>

<script lang="ts">
  import { resolve } from '$app/paths';
  import type { Snippet } from 'svelte';

  type Props = {
    crumbs: Crumb[];
    current?: Snippet;
  };

  const { crumbs, current }: Props = $props();
</script>

<nav aria-label="Breadcrumb" class="min-w-0">
  <ol class="flex min-w-0 items-center gap-2 text-[13px] font-medium">
    {#each crumbs as crumb, index (index)}
      {@const isCurrent = index === crumbs.length - 1}
      <li class="flex min-w-0 items-center gap-2">
        {#if index > 0}
          <span class="text-fg-disabled" aria-hidden="true">/</span>
        {/if}
        {#if crumb.path && !isCurrent}
          <a
            href={resolve(crumb.path)}
            class="hover:text-fg-default transition-ink focus-visible:outline-brand -mx-1 -my-1 block truncate rounded-md px-1 py-1 text-fg-muted focus-visible:outline-2"
          >
            {crumb.label}
          </a>
        {:else if isCurrent && current}
          <span class="truncate" aria-current="page">
            {@render current()}
          </span>
        {:else}
          <span
            class={['truncate', { 'text-fg-muted': !isCurrent }]}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {crumb.label}
          </span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
