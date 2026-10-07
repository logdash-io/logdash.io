<script lang="ts">
  import type {
    LegalDocumentDefinition,
    LegalListItem,
  } from '$lib/domains/shared/ui/legal/LegalDocumentDefinition';

  type Props = {
    definition: LegalDocumentDefinition;
    updated?: string;
  };
  const { definition, updated }: Props = $props();

  function anchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function textOf(item: LegalListItem): string {
    return typeof item === 'string' ? item : item.title;
  }

  function leavesOf(item: LegalListItem): string[] {
    return typeof item === 'string' ? [] : (item.list ?? []);
  }
</script>

<div
  class="text-fg-tertiary flex max-w-2xl flex-col gap-11 text-[15px] leading-7 wrap-break-word"
>
  {#each definition as section, index (index)}
    <section class="flex flex-col gap-4">
      <h2
        id={anchor(section.title)}
        class="text-fg-default flex scroll-mt-24 gap-2 text-xl font-medium tracking-[-0.02em]"
      >
        <span class="text-fg-muted tabular-nums">§{index + 1}</span>
        {section.title}
      </h2>

      {#each section.paragraphs ?? [] as paragraph, paragraphIndex (paragraphIndex)}
        <p>{paragraph}</p>
      {/each}

      {#if section.list?.length}
        <ol class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-4">
          {#each section.list as item, itemIndex (itemIndex)}
            {@const number = `${itemIndex + 1}.`}
            <li class="col-span-2 grid grid-cols-subgrid">
              {@render numeral(number)}
              <div class="flex min-w-0 flex-col gap-2">
                {#if item.title}
                  <p>{item.title}</p>
                {/if}

                {#if item.list?.length}
                  <ol class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                    {#each item.list as subItem, subItemIndex (subItemIndex)}
                      {@const subNumber = `${number}${subItemIndex + 1}.`}
                      {@const leaves = leavesOf(subItem)}
                      <li class="col-span-2 grid grid-cols-subgrid">
                        {@render numeral(subNumber)}
                        <div class="flex min-w-0 flex-col gap-2">
                          <p>{textOf(subItem)}</p>

                          {#if leaves.length}
                            <ol
                              class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2"
                            >
                              {#each leaves as leaf, leafIndex (leafIndex)}
                                <li class="col-span-2 grid grid-cols-subgrid">
                                  {@render numeral(
                                    `${subNumber}${leafIndex + 1}.`,
                                  )}
                                  <p>{leaf}</p>
                                </li>
                              {/each}
                            </ol>
                          {/if}
                        </div>
                      </li>
                    {/each}
                  </ol>
                {/if}
              </div>
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  {/each}

  {#if updated}
    <p class="text-fg-muted text-sm">Last updated {updated}</p>
  {/if}
</div>

{#snippet numeral(value: string)}
  <span class="text-fg-muted tabular-nums">{value}</span>
{/snippet}
