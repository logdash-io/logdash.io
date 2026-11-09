<script lang="ts">
  import { resolve } from '$app/paths';
  import HashIcon from '$lib/domains/shared/icons/HashIcon.svelte';
  import LightbulbIcon from '$lib/domains/shared/icons/LightbulbIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import FaqList from '$lib/landing/FaqList.svelte';
  import { headingId } from '$lib/landing/docs/docs-search';
  import { DangerIcon } from '@logdash/hyper-ui/icons';
  import type { Snippet } from 'svelte';
  import CodeBlock from './blocks/CodeBlock.svelte';
  import {
    SDKS,
    type ComparisonWinner,
    type DocBlock,
    type DocPage,
  } from './documentation.data';
  import type { Table, TableType } from './plan-limits';

  type Props = {
    page: DocPage;
    /** Only the plan pages have limits to show, so table blocks may find nothing. */
    tables?: Record<TableType, Table>;
    eyebrow?: string;
    actions?: Snippet;
    afterHeader?: Snippet;
  };

  const { page, tables, eyebrow, actions, afterHeader }: Props = $props();

  const INLINE_MARKUP =
    /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\((?:\/|https:\/\/)[^)\s]*\))/;

  type InlineLink = { label: string; path: string; hash: string };

  function inlineLink(markup: string): InlineLink {
    const [, label, href] = markup.match(/^\[(.+)\]\((.+)\)$/) ?? [];
    const [path, hash] = href.split('#');

    return { label, path, hash: hash ? `#${hash}` : '' };
  }

  /**
   * Ticks and crosses would drag two more colours onto the page, so the
   * winning cell simply reads at full strength and the other one recedes.
   */
  function verdictClass(
    winner: ComparisonWinner,
    column: 'logdash' | 'them',
  ): string {
    if (winner === 'tie') return 'text-fg-secondary';
    return winner === column ? 'text-fg-default' : 'text-fg-muted';
  }

  /** Blocks that read as objects rather than as prose, and want more air. */
  const STRUCTURAL = new Set<DocBlock['type']>([
    'code',
    'code-group',
    'callout',
    'table',
    'plan-limits',
    'comparison',
    'pick-them',
    'steps',
    'faq',
    'cards',
    'sdks',
  ]);

  /**
   * One gap for everything turns spacing into noise: a code block and the
   * paragraph after it end up as far apart as two sentences. Prose stays
   * tight, structural blocks get room, and a heading keeps hugging whatever
   * it introduces.
   */
  function blockSpacing(blocks: DocBlock[], index: number): string {
    if (index === 0) return '';

    const block = blocks[index];
    const previous = blocks[index - 1];

    if (previous.type === 'heading') return previous.level ? 'mt-3' : 'mt-4';
    if (block.type === 'heading') return block.level ? 'mt-9' : 'mt-12';

    return STRUCTURAL.has(block.type) || STRUCTURAL.has(previous.type)
      ? 'mt-8'
      : 'mt-5';
  }
</script>

<!--
  Reference pages are one column of prose. Grids of related pages and SDKs
  are hairline-lined cells, the same quiet lines the landing uses, so the
  page reads as a document rather than a stack of cards.
-->
<article class="flex w-full max-w-2xl flex-col">
  <header class="flex flex-col gap-3">
    {#if eyebrow || actions}
      <div class="flex min-h-7 items-center justify-between gap-4">
        <p class="text-fg-muted text-sm font-medium" data-nosnippet>
          {eyebrow}
        </p>
        {@render actions?.()}
      </div>
    {/if}
    <h1 class="text-4xl font-medium tracking-[-0.03em] text-balance">
      {page.title}
    </h1>
    <p class="text-fg-tertiary text-lg leading-7">{page.description}</p>
  </header>

  {@render afterHeader?.()}

  <div class="mt-10 flex flex-col">
    {#each page.blocks as block, index (index)}
      <div class={blockSpacing(page.blocks, index)}>
        {#if block.type === 'paragraph'}
          <p class="text-fg-tertiary text-[15px] leading-7">
            {@render inline(block.text)}
          </p>
        {:else if block.type === 'heading'}
          {@render heading(block.text, block.level ?? 2)}
        {:else if block.type === 'list'}
          <ul
            class="text-fg-tertiary flex flex-col gap-2 text-[15px] leading-7"
          >
            {#each block.items as item (item)}
              <li class="flex gap-3">
                <span
                  aria-hidden="true"
                  class="bg-current text-fg-faint mt-[13px] size-1 shrink-0 rounded-full"
                ></span>
                <span>{@render inline(item)}</span>
              </li>
            {/each}
          </ul>
        {:else if block.type === 'callout'}
          <div
            class="border-surface-root-border flex gap-3 rounded-xl border px-4 py-3.5"
          >
            {#if block.tone === 'warning'}
              <DangerIcon class="text-warning mt-1 size-4 shrink-0" />
            {:else}
              <LightbulbIcon class="text-fg-muted mt-1 size-4 shrink-0" />
            {/if}
            <p class="text-fg-secondary text-sm leading-6">
              {@render inline(block.text)}
            </p>
          </div>
        {:else if block.type === 'plan-limits'}
          {#if tables}
            {@render table(
              tables[block.key].headers,
              tables[block.key].rows,
              true,
            )}
          {/if}
        {:else if block.type === 'table'}
          {@render table(block.headers, block.rows)}
        {:else if block.type === 'code'}
          <CodeBlock
            code={block.code}
            language={block.language}
            title={block.title}
          />
        {:else if block.type === 'code-group'}
          <CodeBlock tabs={block.items} />
        {:else if block.type === 'faq'}
          <FaqList
            faqs={block.items}
            class="border-surface-root-border border-t"
          />
        {:else if block.type === 'steps'}
          <ol class="flex flex-col">
            {#each block.items as step, stepIndex (step.title)}
              <li class="relative flex gap-4 pb-8 last:pb-0">
                {#if stepIndex < block.items.length - 1}
                  <span
                    aria-hidden="true"
                    class="bg-surface-root-border absolute top-6 bottom-0 left-3 w-px -translate-x-1/2"
                  ></span>
                {/if}
                <!-- The <ol> already numbers the steps for screen readers. -->
                <span
                  aria-hidden="true"
                  class="border-surface-root-border bg-surface-root-bg text-fg-tertiary relative flex size-6 shrink-0 items-center justify-center rounded-full border text-xs"
                >
                  {stepIndex + 1}
                </span>
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <strong class="text-[15px] leading-6 font-medium">
                    {step.title}
                  </strong>
                  <span class="text-fg-tertiary text-sm leading-6">
                    {@render inline(step.text)}
                  </span>
                  {#if step.code}
                    <div class="mt-3">
                      <CodeBlock
                        code={step.code.code}
                        language={step.code.language}
                        title={step.code.title}
                      />
                    </div>
                  {:else if step.tabs}
                    <div class="mt-3">
                      <CodeBlock tabs={step.tabs} />
                    </div>
                  {/if}
                </div>
              </li>
            {/each}
          </ol>
        {:else if block.type === 'comparison'}
          <div class="flex flex-col gap-3">
            {#if block.title}
              <h3 class="text-[15px] font-medium">{block.title}</h3>
            {/if}
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-surface-root-border border-b">
                    <th class="text-fg-muted pr-6 pb-2.5 text-left font-medium">
                      Feature
                    </th>
                    <th class="text-fg-muted pr-6 pb-2.5 text-left font-medium">
                      Logdash
                    </th>
                    <th class="text-fg-muted pb-2.5 text-left font-medium">
                      {block.them}
                    </th>
                  </tr>
                </thead>
                <!-- Closed off at the bottom, or the block below reads as one more row. -->
                <tbody
                  class="border-surface-root-border divide-surface-root-border divide-y border-b"
                >
                  {#each block.rows as row (row.feature)}
                    <tr>
                      <td class="text-fg-secondary py-3 pr-6 align-top">
                        {row.feature}
                      </td>
                      <td
                        class={[
                          'py-3 pr-6 align-top',
                          verdictClass(row.winner, 'logdash'),
                        ]}
                      >
                        {row.logdash}
                      </td>
                      <td
                        class={[
                          'py-3 align-top',
                          verdictClass(row.winner, 'them'),
                        ]}
                      >
                        {row.them}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {:else if block.type === 'pick-them'}
          <!-- Ruled off to the left so the concession reads as deliberate. -->
          <div
            class="border-surface-root-border flex flex-col gap-3 border-l pl-5"
          >
            <h3 class="text-[15px] font-medium">
              When {block.them} is the better pick
            </h3>
            <ul
              class="text-fg-tertiary flex flex-col gap-2 text-[15px] leading-7"
            >
              {#each block.reasons as reason (reason)}
                <li class="flex gap-3">
                  <span
                    aria-hidden="true"
                    class="bg-current text-fg-faint mt-[13px] size-1 shrink-0 rounded-full"
                  ></span>
                  <span>{reason}</span>
                </li>
              {/each}
            </ul>
          </div>
        {:else if block.type === 'cards'}
          <div
            class="bg-surface-root-border border-surface-root-border grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-2"
          >
            {#each block.items as card (card.href)}
              {@const Icon = card.icon}
              <a
                href={resolve(card.href)}
                class="bg-surface-root-bg hover:bg-surface-root-hover-bg group flex flex-col gap-4 p-5"
              >
                <div
                  class="border-surface-root-border bg-surface-root-bg flex size-9 items-center justify-center rounded-lg border"
                >
                  <Icon
                    class="text-fg-tertiary group-hover:text-fg-default size-4 transition-ink duration-150"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[15px] font-medium">{card.title}</span>
                  <span class="text-fg-tertiary text-sm leading-6">
                    {card.description}
                  </span>
                </div>
              </a>
            {/each}
          </div>
        {:else if block.type === 'sdks'}
          <div
            class="bg-surface-root-border border-surface-root-border grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-4"
          >
            {#each SDKS as sdk (sdk.id)}
              {@const Icon = sdk.icon}
              <a
                href={resolve(`/docs/sdks/${sdk.slug}`)}
                class="bg-surface-root-bg hover:bg-surface-root-hover-bg text-fg-secondary hover:text-fg-default flex items-center gap-2.5 px-4 py-3 text-sm transition-ink duration-150"
              >
                <Icon class="size-4 shrink-0" />
                {sdk.name}
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</article>

{#snippet heading(text: string, level: 2 | 3)}
  {@const id = headingId(text)}
  <svelte:element
    this={level === 3 ? 'h3' : 'h2'}
    {id}
    class={[
      'group relative scroll-mt-24',
      level === 3
        ? 'text-base font-medium'
        : 'text-xl font-medium tracking-[-0.02em]',
    ]}
  >
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- same-page anchor -->
    <a
      href="#{id}"
      aria-label="Link to {text}"
      data-nosnippet
      class="text-fg-faint hover:text-fg-default focus-visible:text-fg-default absolute top-1/2 -left-7 hidden size-6 -translate-y-1/2 items-center justify-center rounded-md opacity-0 transition-[opacity,color] duration-150 group-hover:opacity-100 focus-visible:opacity-100 lg:flex"
    >
      <HashIcon class="size-3.5" />
    </a>
    {text}
  </svelte:element>
{/snippet}

{#snippet inline(text: string)}
  {#each text.split(INLINE_MARKUP) as part, index (index)}
    {#if index % 2 === 0}
      {part}
    {:else if part.startsWith('`')}
      <code
        class={[
          'bg-surface-100-bg text-fg-secondary box-decoration-clone rounded px-1 py-0.5 font-mono text-[0.875em]',
          { 'whitespace-nowrap': !part.includes(' ') },
        ]}
      >
        {part.slice(1, -1)}
      </code>
    {:else if part.startsWith('**')}
      <strong class="text-fg-secondary font-medium">{part.slice(2, -2)}</strong>
    {:else}
      {@const link = inlineLink(part)}
      {#if link.path.startsWith('/')}
        <a
          href="{resolve(link.path as '/')}{link.hash}"
          class="text-fg-secondary hover:text-fg-default underline underline-offset-2 transition-ink duration-150"
        >
          {link.label}
        </a>
      {:else}
        <!-- eslint-disable svelte/no-navigation-without-resolve -- external page -->
        <a
          href="{link.path}{link.hash}"
          target="_blank"
          rel="noopener noreferrer"
          class="text-fg-secondary hover:text-fg-default inline-flex items-baseline gap-0.5 underline underline-offset-2 transition-ink duration-150"
        >
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
          {link.label}
          <OpenIcon class="size-2.5 shrink-0 self-center" />
        </a>
      {/if}
    {/if}
  {/each}
{/snippet}

{#snippet table(headers: string[], rows: string[][], fixed = false)}
  <div class="overflow-x-auto">
    <table class={['w-full text-sm', { 'table-fixed': fixed }]}>
      <thead>
        <tr class="border-surface-root-border border-b">
          {#each headers as header, headerIndex (header)}
            <th
              class={[
                'text-fg-muted pr-6 pb-2.5 text-left font-medium whitespace-nowrap last:pr-0',
                { 'w-2/5': fixed && headerIndex === 0 },
              ]}
            >
              {header}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody
        class="border-surface-root-border divide-surface-root-border divide-y border-b"
      >
        {#each rows as row, rowIndex (rowIndex)}
          <tr>
            {#each row as cell, cellIndex (cellIndex)}
              <td
                class={[
                  'py-3 pr-6 align-top leading-6 last:pr-0',
                  cellIndex === 0 ? 'text-fg-secondary' : 'text-fg-tertiary',
                ]}
              >
                {@render inline(cell)}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}
