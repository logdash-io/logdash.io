<script lang="ts">
  import { page } from '$app/state';
  import { intersect } from '$lib/domains/shared/ui/actions/use-intersect.svelte';
  import {
    tableTitles,
    type TableType,
    type DocSection,
    type Table,
  } from './documentation.data';
  import { documentationState } from './documentation.state.svelte';

  const docSections = $derived(page.data.docSections as DocSection[]);

  function onSectionIntersect(
    sectionId: string,
    isIntersecting: boolean,
    ratio: number,
  ): void {
    documentationState.updateSectionVisibility(
      sectionId,
      isIntersecting,
      ratio,
    );
  }
</script>

{#each docSections as section}
  <section
    id={section.id}
    class="mb-16 scroll-mt-32"
    use:intersect={{
      rootMargin: '-100px 0px -50% 0px',
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      callback: ({ isIntersecting, intersectionRatio }) => {
        onSectionIntersect(section.id, isIntersecting, intersectionRatio);
      },
    }}
  >
    <h1 class="mb-6 text-3xl font-bold">{section.title}</h1>
    <div class="prose prose-sm max-w-none text-base-content/80">
      <p class="whitespace-pre-wrap">{section.content}</p>
    </div>

    {#if section.tables}
      {#each Object.entries(section.tables) as [tableKey, tableData]}
        {@render dataTable(tableKey, tableData as Table)}
      {/each}
    {/if}
  </section>
{/each}

{#snippet dataTable(tableKey: string, tableData: Table)}
  <div id={`table-${tableKey}`} class="mt-8 scroll-mt-32">
    <h3 class="mb-3 text-lg font-semibold">
      {tableTitles[tableKey as TableType] || tableKey}
    </h3>
    <div class="overflow-x-auto">
      <table class="table-zebra table w-full">
        <thead>
          <tr>
            {#each tableData.headers as header}
              <th class="text-base-content/70">{header}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each tableData.rows as row}
            <tr>
              {#each row as cell}
                <td>{cell}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/snippet}
