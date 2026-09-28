<script lang="ts">
  import { resolve } from '$app/paths';
  import Highlight from 'svelte-highlight';
  import { typescript } from 'svelte-highlight/languages';
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import OpenIcon from '$lib/domains/shared/icons/OpenIcon.svelte';
  import { Button, Tooltip } from '@logdash/hyper-ui/presentational';
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

<div class="border-border-default flex flex-col gap-4 rounded-xl border p-4">
  {@render copyRow('Status page id', dashboardId)}
  {@render copyRow('API URL', apiUrl)}
  {@render copyRow('Install command', INSTALL_COMMAND)}

  <div class="flex flex-col gap-1.5">
    <span class="text-sm text-neutral-400">React hook</span>
    <div class="flex items-start gap-2">
      <Highlight
        class="code-snippet selection:bg-surface-100 min-w-0 flex-1 text-sm"
        code={hookExample}
        language={typescript}
      />
      {@render copyButton('Hook example', hookExample)}
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
      class="gap-1"
    >
      <OpenIcon class="size-3.5" />
      Next.js starter
    </Button>
  </div>
</div>

{#snippet copyRow(label: string, value: string)}
  <div class="flex flex-col gap-1.5">
    <span class="text-sm text-neutral-400">{label}</span>
    <div class="flex items-center gap-2">
      <code
        class="bg-surface-well border-border-default min-w-0 flex-1 truncate rounded-xl border px-3 py-2 font-mono text-sm"
      >
        {value}
      </code>
      {@render copyButton(label, value)}
    </div>
  </div>
{/snippet}

{#snippet copyButton(label: string, value: string)}
  <Tooltip content="Copy" placement="top">
    <Button
      variant="ghost"
      size="sm"
      shape="square"
      aria-label="Copy {label.toLowerCase()}"
      onclick={() => onCopy(value, label)}
    >
      <CopyIcon class="h-4 w-4" />
    </Button>
  </Tooltip>
{/snippet}
