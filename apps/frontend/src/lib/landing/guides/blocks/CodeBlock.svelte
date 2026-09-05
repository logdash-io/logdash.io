<script lang="ts">
  import { CheckIcon, CopyIcon } from 'lucide-svelte';
  import Highlight from 'svelte-highlight';
  import {
    bash,
    csharp,
    elixir,
    go,
    java,
    javascript,
    json,
    php,
    python,
    ruby,
    rust,
    typescript,
    type LanguageType,
    yaml,
  } from 'svelte-highlight/languages';
  import type { CodeLanguage } from '../documentation.data';

  type Props = {
    code: string;
    language: CodeLanguage;
    title?: string;
  };

  const { code, language, title }: Props = $props();

  /**
   * Grammars are named one by one so highlight.js ships thirteen languages
   * rather than the whole two hundred the barrel export can reach.
   */
  const grammars: Record<CodeLanguage, LanguageType<string>> = {
    bash,
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
  };

  let copied = $state(false);

  /** The check is time-based, so the reset lives where it can be cancelled. */
  $effect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => {
      copied = false;
    }, 1500);

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
<div class="doc-code border-hairline overflow-hidden rounded-xl border">
  {#if title}
    <div class="border-hairline border-b px-4 py-2">
      <span class="text-neutral-500 text-xs font-medium">{title}</span>
    </div>
  {/if}

  <!--
    The right padding is a gutter the code never scrolls into, so a long
    first line clips against empty space instead of sliding under the button.
  -->
  <div class="relative pr-12">
    <Highlight class="font-mono" {code} language={grammars[language]} />

    <button
      type="button"
      onclick={onCopy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      class="text-neutral-600 hover:text-base-content bg-base-300 absolute top-3 right-3 flex size-7 items-center justify-center rounded-md transition-ink duration-150"
    >
      {#if copied}
        <CheckIcon class="size-3.5" />
      {:else}
        <CopyIcon class="size-3.5" />
      {/if}
    </button>
  </div>
</div>

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
</style>
