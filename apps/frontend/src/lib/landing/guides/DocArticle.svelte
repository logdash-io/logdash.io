<script lang="ts">
  import { resolve } from '$app/paths';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import FaqList from '$lib/landing/FaqList.svelte';
  import CodeBlock from './blocks/CodeBlock.svelte';
  import {
    SDKS,
    type ComparisonWinner,
    type DocBlock,
    type DocPage,
  } from './documentation.data';
  import { tableTitles, type Table, type TableType } from './plan-limits';

  type Props = {
    page: DocPage;
    /** Only the plan pages have limits to show, so table blocks may find nothing. */
    tables?: Record<TableType, Table>;
  };

  const { page, tables }: Props = $props();

  function anchor(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  /**
   * Ticks and crosses would drag two more colours onto the page, so the
   * winning cell simply reads at full strength and the other one recedes.
   */
  function verdictClass(
    winner: ComparisonWinner,
    column: 'logdash' | 'them',
  ): string {
    if (winner === 'tie') return 'text-neutral-300';
    return winner === column ? 'text-base-content' : 'text-neutral-500';
  }

  /** Blocks that read as objects rather than as prose, and want more air. */
  const STRUCTURAL = new Set<DocBlock['type']>([
    'code',
    'table',
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

    if (previous.type === 'heading') return 'mt-4';
    if (block.type === 'heading') return 'mt-11';

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
    <h1 class="text-4xl font-medium tracking-[-0.03em]">{page.title}</h1>
    <p class="text-neutral-400 text-lg leading-7">{page.description}</p>
  </header>

  <div class="mt-10 flex flex-col">
    {#each page.blocks as block, index (index)}
      <div class={blockSpacing(page.blocks, index)}>
        {#if block.type === 'paragraph'}
          <p class="text-neutral-400 text-[15px] leading-7">{block.text}</p>
        {:else if block.type === 'heading'}
          <h2
            id={anchor(block.text)}
            class="scroll-mt-24 text-xl font-medium tracking-[-0.02em]"
          >
            {block.text}
          </h2>
        {:else if block.type === 'list'}
          <ul
            class="text-neutral-400 flex flex-col gap-2 text-[15px] leading-7"
          >
            {#each block.items as item (item)}
              <li class="flex gap-3">
                <span
                  aria-hidden="true"
                  class="bg-neutral-600 mt-[13px] size-1 shrink-0 rounded-full"
                ></span>
                <span>{item}</span>
              </li>
            {/each}
          </ul>
        {:else if block.type === 'table'}
          {#if tables}
            {@render limitsTable(block.key, tables[block.key])}
          {/if}
        {:else if block.type === 'code'}
          <CodeBlock
            code={block.code}
            language={block.language}
            title={block.title}
          />
        {:else if block.type === 'faq'}
          <FaqList faqs={block.items} class="border-hairline border-t" />
        {:else if block.type === 'steps'}
          <ol class="flex flex-col">
            {#each block.items as step, stepIndex (step.title)}
              <li class="relative flex gap-4 pb-6 last:pb-0">
                {#if stepIndex < block.items.length - 1}
                  <span
                    aria-hidden="true"
                    class="bg-hairline absolute top-6 bottom-0 left-3 w-px -translate-x-1/2"
                  ></span>
                {/if}
                <span
                  class="border-hairline bg-base-300 text-neutral-400 relative flex size-6 shrink-0 items-center justify-center rounded-full border text-xs"
                >
                  {stepIndex + 1}
                </span>
                <div class="flex flex-col gap-1">
                  <span class="text-[15px] font-medium">{step.title}</span>
                  <span class="text-neutral-400 text-sm leading-6">
                    {step.text}
                  </span>
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
                  <tr class="border-hairline border-b">
                    <th
                      class="text-neutral-500 pr-6 pb-2.5 text-left font-medium"
                    >
                      Feature
                    </th>
                    <th
                      class="text-neutral-500 pr-6 pb-2.5 text-left font-medium"
                    >
                      Logdash
                    </th>
                    <th class="text-neutral-500 pb-2.5 text-left font-medium">
                      {block.them}
                    </th>
                  </tr>
                </thead>
                <!-- Closed off at the bottom, or the block below reads as one more row. -->
                <tbody
                  class="border-hairline divide-hairline divide-y border-b"
                >
                  {#each block.rows as row (row.feature)}
                    <tr>
                      <td class="text-neutral-300 py-3 pr-6 align-top">
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
          <div class="border-hairline flex flex-col gap-3 border-l pl-5">
            <h3 class="text-[15px] font-medium">
              When {block.them} is the better pick
            </h3>
            <ul
              class="text-neutral-400 flex flex-col gap-2 text-[15px] leading-7"
            >
              {#each block.reasons as reason (reason)}
                <li class="flex gap-3">
                  <span
                    aria-hidden="true"
                    class="bg-neutral-600 mt-[13px] size-1 shrink-0 rounded-full"
                  ></span>
                  <span>{reason}</span>
                </li>
              {/each}
            </ul>
          </div>
        {:else if block.type === 'cards'}
          <div
            class="bg-hairline border-hairline grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-3"
          >
            {#each block.items as card (card.href)}
              {@const Icon = card.icon}
              <a
                href={resolve(card.href)}
                class="bg-base-300 hover:bg-base-200 group flex flex-col gap-4 p-5"
              >
                <div
                  class="border-base-100 bg-base-300 flex size-9 items-center justify-center rounded-lg border"
                >
                  <Icon
                    class="text-neutral-400 group-hover:text-base-content size-[18px] transition-ink duration-150"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[15px] font-medium">{card.title}</span>
                  <span class="text-neutral-400 text-sm leading-6">
                    {card.description}
                  </span>
                </div>
              </a>
            {/each}
          </div>
        {:else if block.type === 'sdks'}
          <div
            class="bg-hairline border-hairline grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-4"
          >
            {#each SDKS as sdk (sdk.id)}
              {@const Icon = sdk.icon}
              <!-- eslint-disable svelte/no-navigation-without-resolve -- external README -->
              <a
                href={sdk.readmeUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="bg-base-300 hover:bg-base-200 group flex items-center gap-2.5 px-4 py-3 text-sm"
              >
                <!-- eslint-enable svelte/no-navigation-without-resolve -->
                <Icon class="size-4 shrink-0" />
                <span class="text-neutral-300 group-hover:text-base-content">
                  {sdk.name}
                </span>
                <OpenIcon
                  class="text-neutral-600 group-hover:text-neutral-400 ml-auto size-3 shrink-0"
                />
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</article>

{#snippet limitsTable(key: TableType, table: Table)}
  <div class="flex flex-col gap-3">
    <h3 class="text-[15px] font-medium">{tableTitles[key]}</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-hairline border-b">
            {#each table.headers as header (header)}
              <th class="text-neutral-500 pr-6 pb-2.5 text-left font-medium">
                {header}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="border-hairline divide-hairline divide-y border-b">
          {#each table.rows as row, rowIndex (rowIndex)}
            <tr>
              {#each row as cell, cellIndex (cellIndex)}
                <td class="text-neutral-300 py-3 pr-6 align-top">
                  {cell}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/snippet}
