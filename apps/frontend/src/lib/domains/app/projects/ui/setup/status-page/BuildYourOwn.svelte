<script lang="ts">
  import { resolve } from '$app/paths';
  import Highlight from 'svelte-highlight';
  import { typescript } from 'svelte-highlight/languages';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import IconButton from '$lib/domains/shared/ui/components/IconButton.svelte';
  import { Button } from '@logdash/hyper-ui/presentational';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte.js';
  import { envConfig } from '$lib/domains/shared/utils/env-config.js';

  type Props = {
    dashboardId: string;
  };

  const { dashboardId }: Props = $props();

  const STARTER_URL =
    'https://github.com/logdash-io/logdash.io/tree/main/templates/status-page-next';
  const INSTALL_COMMAND = 'npm i @logdash/status';

  const apiUrl = $derived(
    `${envConfig.apiBaseUrl}/v1/status_pages/${dashboardId}`,
  );
  const hookExample = $derived(
    `'use client';

import { useStatusPage } from '@logdash/status/react';

export function Status() {
  const { data } = useStatusPage('${dashboardId}');

  return <p>{data?.name}: {data?.status}</p>;
}`,
  );

  async function onCopy(value: string, label: string): Promise<void> {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  }
</script>

<div class="flex flex-col gap-4">
  {@render copyRow('Status page ID', dashboardId)}
  {@render copyRow('API URL', apiUrl)}
  {@render copyRow('Install command', INSTALL_COMMAND)}

  <div class="flex flex-col gap-1.5">
    <span class="text-xs text-neutral-500">React hook</span>
    <div class="relative">
      <Highlight
        class="border-hairline selection:bg-surface-100 rounded-lg border bg-neutral-950 text-sm [&>code]:pr-12!"
        code={hookExample}
        language={typescript}
      />
      <span class="absolute top-3 right-3">
        {@render copyButton('Hook example', hookExample)}
      </span>
    </div>
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <Button href={resolve('/docs/status-pages')} variant="neutral" size="sm">
      Read the docs
    </Button>
    <Button
      href={STARTER_URL}
      target="_blank"
      rel="noopener noreferrer"
      variant="neutral"
      size="sm"
    >
      Next.js starter
      <OpenIcon class="size-3.5" />
    </Button>
  </div>
</div>

{#snippet copyRow(label: string, value: string)}
  <div class="flex flex-col gap-1.5">
    <span class="text-xs text-neutral-500">{label}</span>
    <div class="flex items-center gap-2">
      <code
        class="border-hairline flex h-8 min-w-0 flex-1 items-center rounded-lg border bg-neutral-950 px-2.5 font-mono text-sm"
      >
        <span class="truncate">{value}</span>
      </code>
      {@render copyButton(label, value)}
    </div>
  </div>
{/snippet}

{#snippet copyButton(label: string, value: string)}
  <IconButton
    label="Copy {label.toLowerCase()}"
    tooltip="Copy"
    onclick={() => onCopy(value, label)}
  >
    <CopyIcon class="size-4" />
  </IconButton>
{/snippet}
