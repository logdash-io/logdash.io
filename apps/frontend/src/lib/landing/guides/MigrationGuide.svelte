<script lang="ts">
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import MagicWandIcon from '$lib/domains/shared/icons/MagicWandIcon.svelte';
  import { CheckIcon } from 'lucide-svelte';
  import {
    migrationChanges,
    migrationPrompt,
    newFeatures,
  } from './guides.data';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte';

  let copied = $state(false);

  async function onCopyPrompt(): Promise<void> {
    await navigator.clipboard.writeText(migrationPrompt);
    toast.success('Migration prompt copied to clipboard');
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<div class="flex w-full flex-col gap-12">
  <header class="flex flex-col gap-4">
    <h1 class="text-3xl font-bold sm:text-4xl">
      Migrating from @logdash/js-sdk to @logdash/node
    </h1>
    <p class="text-base-content/70 text-lg">
      The new @logdash/node package provides a simpler, unified API that puts
      logging and metrics into a single interface. This guide will help you
      migrate your existing codebase.
    </p>
  </header>

  <section class="flex flex-col gap-6">
    <h2 class="text-2xl font-semibold">What Changed</h2>
    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr class="border-base-content/10 border-b">
            <th class="text-base-content/60 text-left font-medium">Aspect</th>
            <th class="text-base-content/60 text-left font-medium">
              Old (@logdash/js-sdk)
            </th>
            <th class="text-base-content/60 text-left font-medium">
              New (@logdash/node)
            </th>
          </tr>
        </thead>
        <tbody>
          {#each migrationChanges as change}
            <tr class="border-base-content/5 border-b">
              <td class="py-4 font-medium">{change.aspect}</td>
              <td class="py-4">
                <code class="bg-base-300 rounded px-2 py-1 text-sm">
                  {change.oldSdk}
                </code>
              </td>
              <td class="py-4">
                <code
                  class="bg-primary/5 text-primary rounded px-2 py-1 text-sm"
                >
                  {change.newSdk}
                </code>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="flex flex-col gap-6">
    <h2 class="text-2xl font-semibold">New Features</h2>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      {#each newFeatures as feature}
        <div class="ld-card flex flex-col gap-3 p-6">
          <h3 class="text-lg font-semibold">{feature.title}</h3>
          <p class="text-base-content/70 text-sm">{feature.description}</p>
          <pre
            class="bg-base-300 overflow-x-auto rounded-lg p-4 text-sm"><code>{feature.example}</code></pre>
        </div>
      {/each}
    </div>
  </section>

  <section class="flex flex-col gap-6">
    <h2 class="text-2xl font-semibold">Migrate with AI</h2>
    <p class="text-base-content/70">
      Copy the migration prompt below and paste it into your AI assistant
      (Claude, ChatGPT, Cursor, etc.) to automatically migrate your codebase.
    </p>

    <div class="ld-card relative flex flex-col gap-4 p-6">
      <div class="flex items-center gap-3">
        <div
          class="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg"
        >
          <MagicWandIcon class="h-5 w-5" />
        </div>
        <div>
          <h3 class="font-semibold">AI Migration Prompt</h3>
          <p class="text-base-content/60 text-sm">
            Click to copy the prompt to your clipboard
          </p>
        </div>

        <button
          class={['btn btn-sm gap-2 ml-auto btn-primary']}
          onclick={onCopyPrompt}
        >
          {#if copied}
            <CheckIcon class="size-4" />
          {:else}
            <CopyIcon class="size-4" />
          {/if}
          Copy
        </button>
      </div>

      <pre
        class="bg-base-300 overflow-x-auto rounded-lg p-4 sm:p-6 text-xs leading-relaxed whitespace-pre-wrap">{migrationPrompt}</pre>
    </div>
  </section>
</div>
