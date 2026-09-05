<script lang="ts">
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import { toast } from '$lib/domains/shared/ui/toaster/toast.state.svelte';
  import { CheckIcon } from 'lucide-svelte';
  import {
    migrationChanges,
    migrationPrompt,
    newFeatures,
  } from './guides.data';

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

<article class="flex w-full max-w-2xl flex-col">
  <header class="flex flex-col gap-3">
    <h1 class="text-4xl font-medium tracking-[-0.03em]">
      Migrate to @logdash/node
    </h1>
    <p class="text-neutral-400 text-lg leading-7">
      The @logdash/node package replaces @logdash/js-sdk and puts logging and
      metrics behind one class. Here is everything that changed, and a prompt
      that does the work for you.
    </p>
  </header>

  <div class="mt-10 flex flex-col gap-5">
    <h2
      id="what-changed"
      class="mt-6 scroll-mt-24 text-xl font-medium tracking-[-0.02em]"
    >
      What changed
    </h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-hairline border-b">
            <th class="text-neutral-500 pr-6 pb-2.5 text-left font-medium">
              Aspect
            </th>
            <th class="text-neutral-500 pr-6 pb-2.5 text-left font-medium">
              @logdash/js-sdk
            </th>
            <th class="text-neutral-500 pb-2.5 text-left font-medium">
              @logdash/node
            </th>
          </tr>
        </thead>
        <tbody class="divide-hairline divide-y">
          {#each migrationChanges as change (change.aspect)}
            <tr>
              <td class="py-3 pr-6 align-top whitespace-nowrap">
                {change.aspect}
              </td>
              <td class="py-3 pr-6 align-top">
                <code class="text-neutral-400 font-mono text-[13px]">
                  {change.oldSdk}
                </code>
              </td>
              <td class="py-3 align-top">
                <code class="font-mono text-[13px]">{change.newSdk}</code>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <h2
      id="new-in-logdash-node"
      class="mt-6 scroll-mt-24 text-xl font-medium tracking-[-0.02em]"
    >
      New in @logdash/node
    </h2>
    <div
      class="bg-hairline border-hairline grid grid-cols-1 gap-px overflow-hidden rounded-xl border"
    >
      {#each newFeatures as feature (feature.title)}
        <div class="bg-base-300 flex flex-col gap-3 p-5">
          <div class="flex flex-col gap-1">
            <span class="text-[15px] font-medium">{feature.title}</span>
            <span class="text-neutral-400 text-sm leading-6">
              {feature.description}
            </span>
          </div>
          <pre
            class="bg-base-200 overflow-x-auto rounded-lg px-3.5 py-3 font-mono text-[13px] leading-6"><code>{feature.example}</code></pre>
        </div>
      {/each}
    </div>

    <h2
      id="migrate-with-ai"
      class="mt-6 scroll-mt-24 text-xl font-medium tracking-[-0.02em]"
    >
      Migrate with AI
    </h2>
    <p class="text-neutral-400 text-[15px] leading-7">
      Copy the prompt into Claude, ChatGPT or Cursor and let it rewrite the
      imports and calls across your codebase.
    </p>
    <div class="border-hairline overflow-hidden rounded-xl border">
      <div
        class="border-hairline flex items-center justify-between border-b py-2 pr-2 pl-4"
      >
        <span class="text-sm font-medium">Migration prompt</span>
        <button
          type="button"
          class="btn btn-subtle btn-xs gap-1.5 rounded-full px-3"
          onclick={onCopyPrompt}
        >
          {#if copied}
            <CheckIcon class="size-3.5" />
            Copied
          {:else}
            <CopyIcon class="size-3.5" />
            Copy
          {/if}
        </button>
      </div>
      <pre
        class="text-neutral-300 overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">{migrationPrompt}</pre>
    </div>
  </div>
</article>
