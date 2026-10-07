<script lang="ts">
  import CopyIcon from '$lib/domains/shared/icons/CopyIcon.svelte';
  import { CheckIcon } from '@logdash/hyper-ui/icons';
  import type { Component } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import Highlight from 'svelte-highlight';
  import {
    csharp,
    elixir,
    go,
    java,
    javascript,
    json,
    php,
    plaintext,
    powershell,
    python,
    ruby,
    rust,
    typescript,
    type LanguageType,
    xml,
    yaml,
  } from 'svelte-highlight/languages';
  import type { CodeLanguage } from '../documentation.data';
  import { commandBash } from './bash-grammar';

  type Props = {
    code: string;
    language: CodeLanguage;
    title?: string;
    icon?: Component<{ class?: ClassValue }>;
  };

  const { code, language, title, icon: Icon }: Props = $props();

  /**
   * Grammars are named one by one so highlight.js ships seventeen languages
   * rather than the whole two hundred the barrel export can reach.
   */
  const grammars: Record<CodeLanguage, LanguageType<string>> = {
    bash: commandBash,
    javascript,
    typescript,
    python,
    go,
    csharp,
    elixir,
    java,
    ruby,
    php,
    rust,
    yaml,
    json,
    html: { name: 'html', register: xml.register },
    powershell,
    svelte: { name: 'svelte', register: xml.register },
    text: plaintext,
  };

  let copied = $state(false);

  /** The check is time-based, so the reset lives where it can be cancelled. */
  $effect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => {
      copied = false;
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  });

  async function onCopy(): Promise<void> {
    await navigator.clipboard.writeText(code);
    copied = true;
  }
</script>

<!--
  Highlighting runs at render time, so the block is already a readable
  pre/code before any JavaScript loads. The copy button is the only part
  that needs the browser, and its absence costs nothing.
-->
<div
  class="doc-code border-surface-root-border overflow-hidden rounded-xl border"
>
  {#if title}
    <div
      class="border-surface-root-border flex h-9 items-center justify-between border-b pr-1 pl-4"
    >
      <span class="text-fg-muted flex items-center gap-2 text-xs font-medium">
        {#if Icon}
          <Icon class="size-3.5 shrink-0" />
        {/if}
        {title}
      </span>
      {@render copyButton()}
    </div>

    <Highlight class="font-mono" {code} language={grammars[language]} />
  {:else}
    <!--
      The right padding is a gutter the code never scrolls into, so a long
      first line clips against empty space instead of sliding under the button.
    -->
    <div class="corner relative sm:pr-12">
      <Highlight class="font-mono" {code} language={grammars[language]} />

      <div class="absolute top-2 right-2 sm:top-3 sm:right-3">
        {@render copyButton()}
      </div>
    </div>
  {/if}
</div>

{#snippet copyButton()}
  <button
    type="button"
    onclick={onCopy}
    aria-label={copied ? 'Copied' : 'Copy code'}
    class="text-fg-faint hover:text-fg-default bg-surface-root-bg flex size-7 items-center justify-center rounded-md transition-ink duration-150"
  >
    {#if copied}
      <CheckIcon class="size-3.5" />
    {:else}
      <CopyIcon class="size-3.5" />
    {/if}
  </button>
  <span class="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
{/snippet}

<style>
  /*
    svelte-highlight owns the pre element, so the theme sheet's own block
    background and padding have to be unpicked from out here.
  */
  .doc-code :global(pre) {
    margin: 0;
    background: transparent;
  }

  .doc-code :global(pre code.hljs) {
    display: block;
    overflow-x: auto;
    background: transparent;
    padding: 1rem;
    font-size: 13px;
    line-height: 1.625;
    /*
      gofmt indents with tabs, which the browser draws at eight columns and
      no other sample here uses. Two matches the space-indented blocks and
      keeps a Go handler inside the column instead of scrolling it.
    */
    tab-size: 2;
  }

  .doc-code :global(pre[data-language='plaintext'] code.hljs) {
    white-space: pre-wrap;
  }

  @media (width < 40rem) {
    .doc-code .corner :global(pre code.hljs) {
      padding-top: 2.75rem;
    }
  }
</style>
