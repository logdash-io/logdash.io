<script lang="ts">
  import { resolve } from '$app/paths';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import { stripProtocol } from '$lib/domains/shared/utils/url.js';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';

  type Props = {
    clusterId: string;
    statusPageId: string;
    name: string;
    url: string;
    monitorsCount: number;
    isPublished: boolean;
    onCopyUrl: () => void;
  };

  const {
    clusterId,
    statusPageId,
    name,
    url,
    monitorsCount,
    isPublished,
    onCopyUrl,
  }: Props = $props();
</script>

<li
  class="hover:bg-surface-50-hover-bg has-[a:focus-visible]:bg-surface-50-hover-bg relative flex h-11 items-center gap-4 px-4 text-sm"
>
  <a
    href={resolve('/app/domains/[cluster_id]/status-pages/[status_page_id]', {
      cluster_id: clusterId,
      status_page_id: statusPageId,
    })}
    class="min-w-0 flex-1 truncate font-medium outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand sm:w-48 sm:flex-none lg:w-64"
  >
    {name}
  </a>

  <span class="text-fg-muted min-w-0 flex-1 truncate max-sm:hidden">
    {stripProtocol(url)}
  </span>

  <span class="text-fg-muted w-24 shrink-0 tabular-nums max-md:hidden">
    {monitorsCount}
    {monitorsCount === 1 ? 'monitor' : 'monitors'}
  </span>

  <span class="flex shrink-0 items-center gap-2 sm:w-20">
    <span
      class={[
        'size-1.5 shrink-0 rounded-full',
        isPublished ? 'bg-success' : 'bg-idle',
      ]}
    ></span>
    <span class={{ 'text-fg-muted': !isPublished }}>
      {isPublished ? 'Published' : 'Draft'}
    </span>
  </span>

  {#if isPublished}
    <span class="-mr-1.5 flex shrink-0 items-center justify-end gap-1 sm:w-15">
      <IconButton
        label="Copy the URL of {name}"
        tooltip="Copy URL"
        raised
        onclick={onCopyUrl}
      >
        <CopyIcon class="size-4" />
      </IconButton>
      <IconButton label="Open {name}" tooltip="Open" href={url} raised>
        <OpenIcon class="size-4" />
      </IconButton>
    </span>
  {:else}
    <span class="-mr-1.5 w-15 shrink-0 max-sm:hidden"></span>
  {/if}
</li>
