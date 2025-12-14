<script lang="ts">
  import type { LegalDocumentDefinition } from '$lib/domains/shared/ui/legal/LegalDocumentDefinition';

  const { definition }: { definition: LegalDocumentDefinition } = $props();
</script>

<div style="word-break: break-all; white-space: normal;">
  {#each definition as section, index}
    <h5 class="mt-2 mb-5 text-center md:mt-6">
      §{index + 1}
      <br />
      <span>{@html section.title}</span>
    </h5>

    {#if section.paragraphs}
      {#each section.paragraphs as paragraph}
        <p class="mb-3">{@html paragraph}</p>
      {/each}
    {:else}
      <div class="w-full overflow-hidden pl-0">
        <div class="flex flex-col">
          {#each section.list as listItem, listItemIndex}
            <div class="mb-3">
              <span class="mb-1 block">
                {listItemIndex + 1}.&nbsp;
                <span>{@html listItem.title || ''}</span>
              </span>
              <div class="flex flex-col pl-4">
                {#each listItem.list as item, itemIndex}
                  {#if typeof item === 'string'}
                    <div class="mb-1">
                      {listItemIndex + 1}.{itemIndex + 1}.&nbsp;
                      <span>{@html item}</span>
                    </div>
                  {:else}
                    <div class="mb-1">
                      <span class="mb-1 block">
                        {listItemIndex + 1}.{itemIndex + 1}.&nbsp;
                        <span>{@html item.title}</span>
                      </span>
                      <div class="flex flex-col pl-4">
                        {#each item.list as subItem, subItemIndex}
                          <div class="mb-1">
                            {listItemIndex + 1}.{itemIndex + 1}.{subItemIndex +
                              1}.&nbsp;
                            <span>
                              {@html subItem}
                            </span>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/each}
</div>
