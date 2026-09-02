<script module lang="ts">
  export const HERO_URL_INPUT_ID = 'hero-url-input';
</script>

<script lang="ts">
  import {
    anonymousPreviewState,
    type AnonymousPreviewSource,
  } from '$lib/domains/anonymous/application/anonymous-preview.state.svelte';
  import { scrollIntoViewCentered } from '$lib/domains/shared/utils/scroll';
  import {
    isValidUrl,
    tryPrependProtocol,
  } from '$lib/domains/shared/utils/url';
  import { page } from '$app/state';
  import { ArrowRightIcon } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { HERO_SHOWCASE_ID } from './HeroShowcase.svelte';

  type Props = {
    source: AnonymousPreviewSource;
    compact?: boolean;
  };

  const { source, compact = false }: Props = $props();

  let url = $state('');
  let validationMessage = $state<string | null>(null);

  /**
   * A submit that lands before hydration falls back to the browser's native
   * GET, which reloads `/` with `?url=`. Read it back so the typed address
   * survives instead of silently vanishing.
   */
  onMount(() => {
    const submitted = page.url.searchParams.get('url')?.trim();

    if (submitted && !url) {
      url = submitted;
    }
  });

  const isCreating = $derived(anonymousPreviewState.phase === 'creating');
  const submitPosthogId = $derived(`${source}-monitor-url-submit-cta`);

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    const value = url.trim();

    if (!value) {
      validationMessage = 'Enter the address you want us to watch.';
      return;
    }

    if (!isValidUrl(value)) {
      validationMessage = 'That is not a valid URL. Try https://yourapp.com';
      return;
    }

    validationMessage = null;
    revealShowcase();

    await anonymousPreviewState.submit(tryPrependProtocol(value), source);
  }

  function revealShowcase(): void {
    if (source === 'hero') {
      return;
    }

    const showcase = document.getElementById(HERO_SHOWCASE_ID);

    if (showcase) {
      scrollIntoViewCentered(showcase);
    }
  }

  function onInput(): void {
    if (validationMessage) {
      validationMessage = null;
    }
  }
</script>

<form class="flex w-full flex-col gap-2" onsubmit={onSubmit} novalidate>
  <div class="flex w-full flex-col gap-2 sm:flex-row">
    <div class={['w-full min-w-0 sm:flex-1', compact ? 'h-11' : 'h-12']}>
      <input
        class={[
          'ld-input ld-input-padding rounded-full! px-5 text-base',
          { 'border-error/60! focus:border-error!': validationMessage },
        ]}
        id={compact ? undefined : HERO_URL_INPUT_ID}
        type="text"
        name="url"
        inputmode="url"
        autocomplete="url"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        placeholder="https://yourapp.com"
        aria-label="Your app URL"
        aria-invalid={validationMessage ? 'true' : undefined}
        disabled={isCreating}
        bind:value={url}
        oninput={onInput}
      />
    </div>

    <button
      type="submit"
      class={[
        'btn btn-primary shrink-0 rounded-full px-6 font-semibold',
        compact ? 'h-11' : 'h-12',
      ]}
      data-posthog-id={submitPosthogId}
      disabled={isCreating}
    >
      Start monitoring
      {#if isCreating}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        <ArrowRightIcon class="size-4" />
      {/if}
    </button>
  </div>

  {#if validationMessage}
    <p class="text-error pl-5 text-sm" role="alert">
      {validationMessage}
    </p>
  {/if}
</form>
