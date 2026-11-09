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
  import type {
    CodeLanguage,
    DocCode,
    DocCodeTab,
  } from '../documentation.data';
  import { commandBash } from './bash-grammar';
  import { codeTabPreference } from './code-tab.svelte';

  type Item = DocCode & {
    icon?: DocCodeTab['icon'] | Component<{ class?: ClassValue }>;
  };

  type Props = Item | { tabs: DocCodeTab[] };

  const props: Props = $props();
  const id = $props.id();

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

  const tabbed = $derived('tabs' in props);
  const items: Item[] = $derived('tabs' in props ? props.tabs : [props]);
  const selected = $derived(
    items.find((item) => item.title === codeTabPreference.title) ?? items[0],
  );
  const SelectedIcon = $derived(selected.icon);

  let copied = $state(false);
  let tabList: HTMLElement | undefined = $state();

  $effect(() => {
    if (tabbed) {
      codeTabPreference.restore();
    }
  });

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
    await navigator.clipboard.writeText(selected.code);
    copied = true;
  }

  function onSelect(item: Item): void {
    if (item.title) {
      codeTabPreference.choose(item.title);
    }
  }

  function onTabKeydown(event: KeyboardEvent): void {
    const step =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;

    if (step === 0) return;

    event.preventDefault();
    const index = items.indexOf(selected);
    const next = items[(index + step + items.length) % items.length];

    onSelect(next);
    tabList
      ?.querySelectorAll<HTMLElement>('[role="tab"]')
      [items.indexOf(next)]?.focus();
  }
</script>

<!--
  Highlighting runs at render time, so the block is already a readable
  pre/code before any JavaScript loads.
-->
<div
  class="doc-code border-surface-root-border overflow-hidden rounded-xl border"
>
  {#if tabbed}
    <div
      class="border-surface-root-border flex h-10 items-center justify-between gap-2 border-b pr-1 pl-1.5"
    >
      <div
        bind:this={tabList}
        role="tablist"
        aria-label="Language"
        tabindex="-1"
        class="flex min-w-0 items-center self-stretch overflow-x-auto [scrollbar-width:none]"
        onkeydown={onTabKeydown}
      >
        {#each items as item, index (item.title)}
          {@const Icon = item.icon}
          {@const active = item === selected}
          <button
            type="button"
            role="tab"
            id="{id}-tab-{index}"
            aria-selected={active}
            aria-controls="{id}-panel-{index}"
            tabindex={active ? 0 : -1}
            onclick={() => onSelect(item)}
            class={[
              'relative flex shrink-0 items-center gap-2 self-stretch px-2.5 text-xs font-medium transition-ink duration-150',
              active
                ? 'text-fg-default after:bg-surface-inverse-bg after:absolute after:inset-x-2.5 after:-bottom-px after:h-px'
                : 'text-fg-muted hover:text-fg-secondary',
            ]}
          >
            {#if Icon}
              <Icon class="size-3.5 shrink-0" />
            {/if}
            {item.title}
          </button>
        {/each}
      </div>
      {@render copyButton()}
    </div>
  {:else if selected.title}
    <div
      class="border-surface-root-border flex h-9 items-center justify-between border-b pr-1 pl-4"
    >
      <span class="text-fg-muted flex items-center gap-2 text-xs font-medium">
        {#if SelectedIcon}
          <SelectedIcon class="size-3.5 shrink-0" />
        {/if}
        {selected.title}
      </span>
      {@render copyButton()}
    </div>
  {/if}

  {#each items as item, index (item.title ?? index)}
    <!--
      The right padding is a gutter the code never scrolls into, so a long
      first line clips against empty space instead of sliding under the button.
    -->
    <div
      id="{id}-panel-{index}"
      role={tabbed ? 'tabpanel' : undefined}
      aria-labelledby={tabbed ? `${id}-tab-${index}` : undefined}
      hidden={item !== selected}
      class={[{ 'corner relative sm:pr-12': !tabbed && !item.title }]}
    >
      <Highlight
        class="font-mono"
        code={item.code}
        language={grammars[item.language]}
      />

      {#if !tabbed && !item.title}
        <div class="absolute top-2 right-2 sm:top-3 sm:right-3">
          {@render copyButton()}
        </div>
      {/if}
    </div>
  {/each}
</div>

{#snippet copyButton()}
  <button
    type="button"
    onclick={onCopy}
    aria-label={copied ? 'Copied' : 'Copy code'}
    class="text-fg-faint hover:text-fg-default bg-surface-root-bg flex size-7 shrink-0 items-center justify-center rounded-md transition-ink duration-150"
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
