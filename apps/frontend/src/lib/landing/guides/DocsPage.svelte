<script lang="ts">
  import { resolve } from '$app/paths';
  import type { ExposedConfig } from '$lib/domains/shared/exposed-config/domain/exposed-config';
  import ChevronLeftIcon from '$lib/domains/shared/icons/ChevronLeftIcon.svelte';
  import ChevronRightIcon from '$lib/domains/shared/icons/ChevronRightIcon.svelte';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import GitHubIcon from '$lib/domains/shared/icons/GitHubIcon.svelte';
  import { docSourceUrl } from '$lib/landing/docs/docs-pages';
  import { markdownPath } from '$lib/landing/seo/markdown-twin';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import DocArticle from './DocArticle.svelte';
  import {
    docsNavEntries,
    type DocPage,
    type DocsNavEntry,
  } from './documentation.data';
  import { buildTablesFromConfig } from './plan-limits';

  type Props = {
    page: DocPage;
    exposedConfig: ExposedConfig;
  };

  const { page, exposedConfig }: Props = $props();

  type CopyState = 'idle' | 'copied' | 'failed';

  let copyState: CopyState = $state('idle');

  const index = $derived(
    docsNavEntries.findIndex((entry) => entry.href === page.path),
  );
  const previous: DocsNavEntry | undefined = $derived(
    docsNavEntries[index - 1],
  );
  const next: DocsNavEntry | undefined = $derived(docsNavEntries[index + 1]);
  const tables = $derived(buildTablesFromConfig(exposedConfig));

  $effect(() => {
    if (copyState === 'idle') return;

    const timeout = setTimeout(() => {
      copyState = 'idle';
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  });

  async function onCopyPage(): Promise<void> {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': fetchMarkdown() }),
      ]);
      copyState = 'copied';
    } catch {
      copyState = 'failed';
    }
  }

  async function fetchMarkdown(): Promise<Blob> {
    const response = await fetch(markdownPath(page.path));

    if (!response.ok) {
      throw new Error(`${markdownPath(page.path)} answered ${response.status}`);
    }

    return new Blob([await response.text()], { type: 'text/plain' });
  }
</script>

<DocArticle {page} {tables} eyebrow={docsNavEntries[index]?.group}>
  {#snippet actions()}
    <button
      type="button"
      onclick={onCopyPage}
      class="border-surface-root-border text-fg-tertiary hover:text-fg-default hover:bg-surface-root-hover-bg flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-ink duration-150"
    >
      {#if copyState === 'copied'}
        <CheckIcon class="size-3.5" />
        Copied
      {:else}
        <CopyIcon class="size-3.5" />
        {copyState === 'failed' ? 'Could not copy' : 'Copy page'}
      {/if}
    </button>
    <span class="sr-only" aria-live="polite">
      {copyState === 'copied' ? 'Page copied as Markdown' : ''}
    </span>
  {/snippet}
</DocArticle>

<footer class="mt-16 flex w-full max-w-2xl flex-col gap-8">
  <nav aria-label="Previous and next page" class="grid grid-cols-2 gap-4">
    {#if previous}
      <a
        href={resolve(previous.href)}
        class="border-surface-root-border hover:bg-surface-root-hover-bg group flex flex-col gap-1 rounded-xl border px-4 py-3.5"
      >
        <span class="text-fg-muted flex items-center gap-1 text-xs">
          <ChevronLeftIcon class="-ml-0.5 size-3.5" />
          Previous
        </span>
        <span
          class="text-fg-secondary group-hover:text-fg-default text-sm font-medium transition-ink duration-150"
        >
          {previous.title}
        </span>
      </a>
    {/if}
    {#if next}
      <a
        href={resolve(next.href)}
        class="border-surface-root-border hover:bg-surface-root-hover-bg group col-start-2 flex flex-col items-end gap-1 rounded-xl border px-4 py-3.5 text-right"
      >
        <span class="text-fg-muted flex items-center gap-1 text-xs">
          Next
          <ChevronRightIcon class="-mr-0.5 size-3.5" />
        </span>
        <span
          class="text-fg-secondary group-hover:text-fg-default text-sm font-medium transition-ink duration-150"
        >
          {next.title}
        </span>
      </a>
    {/if}
  </nav>

  <div
    class="border-surface-root-border text-fg-muted flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t pt-6 text-sm"
  >
    <!-- eslint-disable svelte/no-navigation-without-resolve -- GitHub and the markdown twin are not routes -->
    <a
      href={docSourceUrl(page.path)}
      target="_blank"
      rel="noopener noreferrer"
      class="hover:text-fg-default flex items-center gap-2 transition-ink duration-150"
    >
      <GitHubIcon class="size-4" />
      Edit this page on GitHub
    </a>
    <a
      href={markdownPath(page.path)}
      data-sveltekit-reload
      class="hover:text-fg-default transition-ink duration-150"
    >
      View as Markdown
    </a>
    <!-- eslint-enable svelte/no-navigation-without-resolve -->
  </div>
</footer>
